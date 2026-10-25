(() => {
  'use strict';
  const roles = window.REUNION_ROLES;
  const roleById = new Map(roles.map(role => [role.id, role]));
  const KEY = 'unit2-reunion-class-v2';
  const maxGroups = 8;
  let canStore = true;
  let state = { version: 2, assignments: {}, groups: [], challengeDeck: [], challengeCount: 0 };
  let activeGroup = null;
  let noticeTimeout;
  const $ = id => document.getElementById(id);

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!saved || saved.version !== 2) return;
      const used = new Set();
      for (let n = 1; n <= maxGroups; n++) {
        const a = saved.assignments?.[n];
        if (!a || !roleById.has(a.roleId) || used.has(a.roleId)) continue;
        const projectIndex = Number.isInteger(a.projectIndex) && a.projectIndex >= 0 && a.projectIndex < roleById.get(a.roleId).projects.length ? a.projectIndex : 0;
        state.assignments[n] = { roleId: a.roleId, projectIndex };
        used.add(a.roleId);
      }
      if (Array.isArray(saved.groups)) state.groups = saved.groups.filter(g => g && typeof g.name === 'string' && g.name.trim() && Number.isSafeInteger(g.votes) && g.votes >= 0).slice(0, 40).map(g => ({ name: g.name.slice(0, 60), votes: g.votes }));
      if (Array.isArray(saved.challengeDeck)) state.challengeDeck = [...new Set(saved.challengeDeck.filter(i => Number.isInteger(i) && i >= 0 && i < challenges.length))];
      if (Number.isSafeInteger(saved.challengeCount) && saved.challengeCount >= 0) state.challengeCount = saved.challengeCount;
    } catch { canStore = false; }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { canStore = false; }
    if (!canStore) {
      $('save-status').textContent = 'Fixed for this open class';
      $('assignment-note').textContent = 'Reopening a group keeps its role and project while this page stays open.';
    }
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function photo(role, className) {
    const node = element('div', `photo sheet-${role.sheet} ${className || ''}`);
    node.style.setProperty('--col', role.col);
    node.style.setProperty('--row', role.row);
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', role.photoAlt);
    return node;
  }
  function notify(message) {
    clearTimeout(noticeTimeout);
    $('notice').textContent = message;
    $('notice').classList.add('visible');
    noticeTimeout = setTimeout(() => $('notice').classList.remove('visible'), 3500);
  }
  function renderGroups() {
    const grid = $('role-assignment-grid');
    grid.replaceChildren();
    for (let n = 1; n <= maxGroups; n++) {
      const a = state.assignments[n];
      const role = a && roleById.get(a.roleId);
      const button = element('button', 'group-card');
      button.type = 'button';
      button.dataset.group = n;
      button.setAttribute('aria-label', role ? `Open Group ${n}: ${role.title}` : `Reveal Group ${n}`);
      const cover = role ? photo(role, 'group-cover') : element('div', 'group-cover unrevealed-cover');
      cover.append(element('span', 'group-number', `GROUP ${String(n).padStart(2, '0')}`));
      if (role) cover.append(element('span', 'locked-label', 'ROLE FIXED'));
      else cover.append(element('span', 'group-secret', '?'));
      const body = element('div', 'group-card-body');
      body.append(element('h3', '', role ? role.title : 'Your future is waiting.'));
      body.append(element('p', '', role ? role.projects[a.projectIndex].title : 'Reveal your career and explore three project ideas.'));
      const open = element('span', 'card-open', role ? 'Open the same brief' : 'Reveal your group brief');
      open.append(element('span', '', '↗'));
      body.append(open);
      button.append(cover, body);
      grid.append(button);
    }
    $('assigned-count').textContent = `${Object.keys(state.assignments).length} of ${maxGroups} groups revealed`;
  }
  function assignRole(n) {
    if (!Number.isInteger(n) || n < 1 || n > maxGroups) return;
    // Assign once per group. Every later click reads this same saved object.
    if (!state.assignments[n]) {
      const used = new Set(Object.values(state.assignments).map(a => a.roleId));
      const available = roles.filter(role => !used.has(role.id));
      const role = available[Math.floor(Math.random() * available.length)];
      if (!role) return;
      state.assignments[n] = { roleId: role.id, projectIndex: 0 };
      persist();
      renderGroups();
    }
    activeGroup = n;
    renderBrief();
    $('role-modal').showModal();
    $('role-modal').scrollTop = 0;
  }
  function renderBrief() {
    const a = state.assignments[activeGroup];
    const role = roleById.get(a.roleId);
    const project = role.projects[a.projectIndex];
    const content = $('role-content');
    content.replaceChildren();
    const top = element('div', 'brief-top');
    const heading = element('div', 'brief-heading');
    heading.append(element('p', 'eyebrow', `GROUP ${String(activeGroup).padStart(2, '0')} / ${role.category.toUpperCase()}`));
    const title = element('h2', '', role.title); title.id = 'role-title';
    heading.append(title, element('p', 'description', role.description));
    const facts = element('div', 'brief-facts');
    ['Your project began in 2032', 'You are speaking in 2035', 'Look ahead to 2045'].forEach(t => facts.append(element('span', '', t)));
    heading.append(facts);top.append(photo(role, 'brief-photo'), heading);
    const body = element('div', 'brief-body');
    body.append(element('h3', '', 'Choose your project direction'), element('p', '', 'Read all three ideas. Choose one to develop together. Your choice stays with this group.'));
    const options = element('div', 'project-options');
    role.projects.forEach((item, index) => {
      const option = element('button', 'project-option');
      option.type = 'button'; option.dataset.project = index;
      option.setAttribute('aria-pressed', String(a.projectIndex === index));
      option.append(element('span', 'project-no', `DIRECTION ${index + 1}`), element('strong', '', item.title), element('span', 'project-summary', item.summary), element('span', 'selection-label', a.projectIndex === index ? '✓ Selected for your group' : 'Choose this project →'));
      options.append(option);
    });
    body.append(options);
    const selected = element('div', 'selected-project');
    selected.append(element('p', 'tiny-label', 'MAKE THE IDEA YOUR OWN'), element('h3', '', project.title));
    const detailGrid = element('div', 'project-detail-grid');
    for (const [label, detail] of [['Decide together', project.decision], ['The problem to solve', project.challenge]]) {
      const detailBox = element('div');detailBox.append(element('h4', '', label), element('p', '', detail));detailGrid.append(detailBox);
    }
    selected.append(detailGrid);body.append(selected);
    body.append(element('h3', '', 'Three speakers. Three future meanings.'));
    const prompts = element('div', 'brief-prompts');
    const speakerPrompts = [
      ['duration', 'The Visionary', 'How long will your team have been working on this project by 2045?', 'Start in 2032. Count the years.'],
      ['result', 'The Planner', 'What clear result will your team have achieved by 2045?', 'Choose a target: a number, a finished product or a place you will have opened.'],
      ['progress', 'The Realist', 'What will your team be doing at ten next Monday?', 'Choose a real activity from your project and explain who will be involved.']
    ];
    speakerPrompts.forEach(([tone, name, prompt, help]) => {
      const card = element('article', `brief-prompt ${tone}`);
      card.append(element('h4', '', name), element('p', '', prompt), element('b', '', help));prompts.append(card);
    });
    body.append(prompts);
    const model = element('details', 'model-conversation');
    model.append(element('summary', '', 'Show one possible conversation'));
    const lines = [
      ['Visionary', `By 2045, we’ll have been ${project.duration} for thirteen years.`],
      ['Planner', `And by then, we’ll have ${project.milestone}.`],
      ['Realist', `To work towards that, at ten next Monday we’ll be ${project.activity}.`]
    ];
    lines.forEach(([name, line]) => {const p=element('p');p.append(element('strong','',name+': '),document.createTextNode(line));model.append(p);});
    body.append(model, element('p', 'brief-endnote', 'Use the example to understand the forms, then add your own details. Rehearse a conversation, listen and respond.'));
    content.append(top, body);
  }
  $('role-assignment-grid').addEventListener('click', event => {
    const button = event.target.closest('button[data-group]');if(button) assignRole(Number(button.dataset.group));
  });
  $('role-content').addEventListener('click', event => {
    const button = event.target.closest('button[data-project]');
    if (!button || activeGroup === null) return;
    const index = Number(button.dataset.project);
    const a = state.assignments[activeGroup];
    if (!Number.isInteger(index) || !roleById.get(a.roleId).projects[index]) return;
    a.projectIndex = index;persist();
    const scroll = $('role-modal').scrollTop;
    renderGroups();renderBrief();$('role-modal').scrollTop = scroll;
    $('role-content').querySelector(`[data-project="${index}"]`).focus({preventScroll:true});
  });
  $('close-role-modal').addEventListener('click', () => $('role-modal').close());
  $('role-modal').addEventListener('close', () => {
    $('role-assignment-grid').querySelector(`[data-group="${activeGroup}"]`)?.focus({preventScroll:true});
  });

  const challenges = [
    'By 2045, what major project will you have completed, and who will it help?',
    'At this time next month, what will each team member be doing to move the project forward?',
    'By 2045, how long will you have been working on your project? Explain the starting year.',
    'By the end of next year, what will you have achieved with a limited budget?',
    'Your project gets twice as many users as expected. What will your team be doing to support them?',
    'What personal goal will each of you have achieved by 2045, outside your work?',
    'How long will you have been working together by 2040? What will you have learned about teamwork?',
    'A sponsor cuts your funding. What will you be doing next month, and what will you still have achieved by 2045?'
  ];
  $('challenge-btn').addEventListener('click', () => {
    if (!state.challengeDeck.length) state.challengeDeck = challenges.map((_,i)=>i).sort(() => Math.random()-.5);
    const question = state.challengeDeck.pop();state.challengeCount++;persist();
    $('challenge-label').textContent = `CHALLENGE ${String(state.challengeCount).padStart(2,'0')}`;
    $('challenge-question-display').textContent = challenges[question];
    $('challenge-btn').firstChild.textContent = 'Reveal another challenge ';
  });
  function renderVotingGallery() {
    $('voting-gallery').replaceChildren();
    state.groups.forEach((group,index) => {
      const card=element('article','vote-card');card.append(element('h3','',group.name));
      const row=element('div','vote-row');
      const count=element('span','vote-count');count.append(element('b','',String(group.votes)),document.createTextNode(group.votes===1?'vote':'votes'));
      const button=element('button','button secondary small','+ Vote');button.type='button';button.dataset.vote=index;button.setAttribute('aria-label',`Vote for ${group.name}`);
      row.append(count,button);card.append(row);$('voting-gallery').append(card);
    });
    $('gallery-empty').hidden = state.groups.length > 0;
  }
  $('group-form').addEventListener('submit', event => {
    event.preventDefault();const name=$('group-name-input').value.trim();
    if(!name){notify('Enter a team name first.');$('group-name-input').focus();return;}
    if(state.groups.some(g=>g.name.toLocaleLowerCase()===name.toLocaleLowerCase())){notify('That team is already in the gallery.');return;}
    if(state.groups.length>=40){notify('This class already has 40 teams.');return;}
    state.groups.push({name,votes:0});persist();renderVotingGallery();$('group-name-input').value='';$('group-name-input').focus();
  });
  $('voting-gallery').addEventListener('click',event=>{
    const button=event.target.closest('button[data-vote]');if(!button)return;
    const index=Number(button.dataset.vote);if(!state.groups[index])return;
    state.groups[index].votes++;persist();renderVotingGallery();
    $('voting-gallery').querySelector(`[data-vote="${index}"]`)?.focus({preventScroll:true});
  });
  $('show-results-btn').addEventListener('click',()=>{
    if(!state.groups.length){notify('Add a team to the gallery first.');return;}
    const highest=Math.max(...state.groups.map(g=>g.votes));
    if(highest===0){notify('Record some class votes before showing the results.');return;}
    const winners=state.groups.filter(g=>g.votes===highest);
    $('results-content').replaceChildren(element('p','',winners.length>1?'A shared first place!':'The class favourite is…'));
    winners.forEach(g=>$('results-content').append(element('p','winner-name',g.name)));
    $('results-content').append(element('p','results-score',`With ${highest} ${highest===1?'vote':'votes'}.`));
    $('results-modal').showModal();
  });
  $('close-results-modal').addEventListener('click',()=>$('results-modal').close());
  $('reset-btn').addEventListener('click',()=>$('reset-modal').showModal());
  $('cancel-reset').addEventListener('click',()=>$('reset-modal').close());
  $('confirm-reset').addEventListener('click',()=>{
    state={version:2,assignments:{},groups:[],challengeDeck:[],challengeCount:0};activeGroup=null;persist();renderGroups();renderVotingGallery();
    $('challenge-label').textContent='YOUR NEXT QUESTION';$('challenge-question-display').textContent='Ready for a question you haven’t rehearsed?';
    $('challenge-btn').firstChild.textContent='Reveal a challenge ';
    $('reset-modal').close();notify('A new class is ready. Reveal your group briefs.');
  });
  // Closing the native dialogs with Escape also keeps every saved assignment.
  restore();persist();renderGroups();renderVotingGallery();
})();
