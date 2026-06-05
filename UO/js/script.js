        (function() {
            // ============ SKILL DATA (COMPLETO COM EXPANSÕES) ============
            const skillCategories = [{
                id: 'combat',
                name: '⚔ Combate',
                icon: '⚔',
                skills: [
                    'Archery', 'Fencing', 'Mace Fighting', 'Swordsmanship',
                    'Wrestling', 'Parrying', 'Tactics', 'Throwing'
                ]
            }, {
                id: 'martial',
                name: '🏯 Artes Marciais',
                icon: '🏯',
                skills: ['Bushido', 'Ninjitsu']
            }, {
                id: 'magic',
                name: '🔮 Magia',
                icon: '🔮',
                skills: [
                    'Magery', 'Meditation', 'Evaluating Intelligence',
                    'Magic Resistance', 'Necromancy', 'Chivalry',
                    'Spellweaving', 'Mysticism', 'Focus', 'Inscription',
                    'Alchemy', 'Imbuing'
                ]
            }, {
                id: 'bardic',
                name: '🎵 Bárdicas',
                icon: '🎵',
                skills: ['Musicianship', 'Peacemaking', 'Provocation', 'Discordance']
            }, {
                id: 'rogue',
                name: '🗡 Ladino',
                icon: '🗡',
                skills: [
                    'Hiding', 'Stealth', 'Stealing', 'Snooping', 'Poisoning',
                    'Remove Trap', 'Detect Hidden', 'Lockpicking', 'Tracking'
                ]
            }, {
                id: 'gathering',
                name: '⛏ Coleta',
                icon: '⛏',
                skills: ['Mining', 'Lumberjacking', 'Fishing']
            }, {
                id: 'crafting',
                name: '🔨 Ofícios',
                icon: '🔨',
                skills: [
                    'Blacksmithy', 'Tailoring', 'Carpentry', 'Tinkering',
                    'Bowcraft/Fletching', 'Cartography', 'Cooking', 'Glassblowing'
                ]
            }, {
                id: 'knowledge',
                name: '📖 Conhecimento',
                icon: '📖',
                skills: [
                    'Anatomy', 'Animal Lore', 'Animal Taming', 'Arms Lore',
                    'Begging', 'Camping', 'Forensic Evaluation', 'Healing',
                    'Herding', 'Item Identification', 'Spirit Speak',
                    'Taste Identification', 'Veterinary'
                ]
            }];

            const allSkills = skillCategories.flatMap(cat =>
                cat.skills.map(s => ({ name: s, category: cat.id, categoryName: cat.name }))
            );

            // ============ STATE ============
            let config = {
                globalCap: 700,
                perSkillCap: 100,
                statusCap: 225,
                individualStatCap: 125,
                isInfiniteCap: false // MODIFICADO: Controle interno para cap infinito
            };
            let slots = [];
            let strStat = 100;
            let dexStat = 100;
            let intStat = 25;
            const INITIAL_SLOT_COUNT = 8;

            const skillsList = document.getElementById('skillsList');
            const slotsGrid = document.getElementById('slotsGrid');
            const addSlotBtn = document.getElementById('addSlotBtn');
            const searchInput = document.getElementById('searchInput');
            const totalUsedEl = document.getElementById('totalUsed');
            const totalCapDisplay = document.getElementById('totalCapDisplay');
            const ringFill = document.getElementById('ringFill');
            const gaugePercent = document.getElementById('gaugePercent');
            const slotsCountEl = document.getElementById('slotsCount');
            const globalCapInput = document.getElementById('globalCapInput');
            const infiniteCapCheckbox = document.getElementById('infiniteCapCheckbox');
            const perSkillCapInput = document.getElementById('perSkillCapInput');
            const statusCapInput = document.getElementById('statusCapInput');
            const individualStatCapInput = document.getElementById('individualStatCapInput');
            const strInput = document.getElementById('strInput');
            const dexInput = document.getElementById('dexInput');
            const intInput = document.getElementById('intInput');
            const statTotalVal = document.getElementById('statTotalVal');
            const statCapDisplay = document.getElementById('statCapDisplay');
            const statTotalRow = document.getElementById('statTotalRow');
            const exportBtn = document.getElementById('exportBtn');
            const resetBtn = document.getElementById('resetBtn');
            const toast = document.getElementById('toast');
            const dragGhost = document.getElementById('dragGhost');
            const mainContent = document.getElementById('mainContent');

            function initSlots() {
                slots = [];
                for (let i = 0; i < INITIAL_SLOT_COUNT; i++) {
                    slots.push(null);
                }
            }

            function init() {
                initSlots();
                populateSkillsList();
                renderSlots();
                updateTotalDisplay();
                updateConfigInputs();
                updateStatusDisplay();
                bindEvents();
            }

            function populateSkillsList(filterText = '') {
                const filter = filterText.toLowerCase().trim();
                skillsList.innerHTML = '';
                let anyVisible = false;

                skillCategories.forEach(cat => {
                    const filteredSkills = cat.skills.filter(s =>
                        s.toLowerCase().includes(filter)
                    );
                    if (filteredSkills.length === 0 && filter) return;

                    anyVisible = true;
                    const catDiv = document.createElement('div');
                    catDiv.className = 'skill-category';
                    catDiv.dataset.category = cat.id;

                    const header = document.createElement('div');
                    header.className = 'category-header';
                    header.innerHTML = `
                        <span class="cat-icon">${cat.icon}</span>
                        <span>${cat.name}</span>
                        <span class="cat-count">${filteredSkills.length}</span>
                    `;
                    catDiv.appendChild(header);

                    filteredSkills.forEach(skillName => {
                        const item = document.createElement('div');
                        item.className = 'skill-item';
                        item.draggable = true;
                        item.dataset.skillName = skillName;
                        item.dataset.category = cat.id;
                        item.innerHTML = `
                            <span class="skill-dot"></span>
                            <span>${skillName}</span>
                        `;

                        if (isSkillPlaced(skillName)) {
                            item.classList.add('placed');
                            item.draggable = false;
                            item.title = 'Já está na build';
                        }

                        item.addEventListener('dragstart', handleDragStart);
                        item.addEventListener('dragend', handleDragEnd);
                        item.addEventListener('click', () => {
                            if (!isSkillPlaced(skillName)) {
                                addSkillToSlot(skillName, cat.id);
                            }
                        });

                        catDiv.appendChild(item);
                    });
                    skillsList.appendChild(catDiv);
                });

                if (!anyVisible) {
                    skillsList.innerHTML =
                        '<div class="no-results">Nenhuma habilidade encontrada...</div>';
                }
            }

            function isSkillPlaced(skillName) {
                return slots.some(s => s && s.skillName === skillName);
            }

            function refreshSkillItemsPlacedState() {
                const items = skillsList.querySelectorAll('.skill-item');
                items.forEach(item => {
                    const skillName = item.dataset.skillName;
                    if (isSkillPlaced(skillName)) {
                        item.classList.add('placed');
                        item.draggable = false;
                        item.title = 'Já está na build';
                    } else {
                        item.classList.remove('placed');
                        item.draggable = true;
                        item.title = '';
                    }
                });
            }

            let draggedSkillName = null;
            let draggedCategory = null;

            function handleDragStart(e) {
                if (isSkillPlaced(this.dataset.skillName)) {
                    e.preventDefault();
                    return;
                }
                draggedSkillName = this.dataset.skillName;
                draggedCategory = this.dataset.category;
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', draggedSkillName);
                if (dragGhost) {
                    dragGhost.textContent = draggedSkillName;
                    dragGhost.style.display = 'block';
                }
            }

            function handleDragEnd(e) {
                this.classList.remove('dragging');
                draggedSkillName = null;
                draggedCategory = null;
                if (dragGhost) dragGhost.style.display = 'none';
                document.querySelectorAll('.slot-card.drag-over').forEach(el => el.classList.remove('drag-over'));
                slotsGrid.classList.remove('grid-drag-over');
            }

            document.addEventListener('dragover', (e) => {
                if (dragGhost && dragGhost.style.display === 'block') {
                    dragGhost.style.left = e.clientX + 'px';
                    dragGhost.style.top = e.clientY + 'px';
                }
            });

            function handleSlotDragOver(e) {
                e.preventDefault();
                e.stopPropagation(); // Evita que a lógica da grid geral conflite com o slot individual
                e.dataTransfer.dropEffect = 'copy';
                this.classList.add('drag-over');
            }

            function handleSlotDragLeave(e) {
                this.classList.remove('drag-over');
            }

            function handleSlotDrop(e) {
                e.preventDefault();
                e.stopPropagation(); // Previne execução dupla no container pai
                this.classList.remove('drag-over');
                const skillName = e.dataTransfer.getData('text/plain') || draggedSkillName;
                const cat = draggedCategory || '';
                if (!skillName) return;
                const slotIndex = parseInt(this.dataset.slotIndex);
                if (isNaN(slotIndex)) return;

                const existingIndex = slots.findIndex(s => s && s.skillName === skillName);
                if (existingIndex >= 0 && existingIndex !== slotIndex) {
                    moveSkill(existingIndex, slotIndex);
                } else if (existingIndex === slotIndex) {
                    // mesmo slot, faz nada
                } else {
                    placeSkillInSlot(slotIndex, skillName, cat);
                }

                draggedSkillName = null;
                draggedCategory = null;
                if (dragGhost) dragGhost.style.display = 'none';
                refreshSkillItemsPlacedState();
                renderSlots();
                updateTotalDisplay();
            }

            function placeSkillInSlot(slotIndex, skillName, category) {
                if (isSkillPlaced(skillName) && slots[slotIndex]?.skillName !== skillName) {
                    const oldIndex = slots.findIndex(s => s && s.skillName === skillName);
                    if (oldIndex >= 0) slots[oldIndex] = null;
                }

                const remaining = getRemainingPoints();
                let defaultPoints = Math.min(config.perSkillCap, remaining, 100);

                // MODIFICADO: Se o cap global foi batido e não for infinito, a skill inicia com 0.0 pontos
                if (!config.isInfiniteCap && remaining <= 0) {
                    defaultPoints = 0;
                } else if (config.isInfiniteCap) {
                    defaultPoints = 100;
                }

                slots[slotIndex] = {
                    skillName: skillName,
                    points: Math.max(0, defaultPoints), // Mínimo agora é 0
                    category: category
                };
                enforceGlobalCap();
                refreshSkillItemsPlacedState();
                renderSlots();
                updateTotalDisplay();
            }

            function moveSkill(fromIndex, toIndex) {
                const skill = slots[fromIndex];
                slots[fromIndex] = slots[toIndex];
                slots[toIndex] = skill;
                refreshSkillItemsPlacedState();
                renderSlots();
                updateTotalDisplay();
            }

            function addSkillToSlot(skillName, category) {
                if (isSkillPlaced(skillName)) {
                    showToast('Esta habilidade já está na build.', true);
                    return;
                }

                const remaining = getRemainingPoints();
                let defaultPoints = Math.min(config.perSkillCap, remaining, 100);

                // MODIFICADO: Adiciona mesmo com cap estourado, iniciando em 0.0 pontos
                if (!config.isInfiniteCap && remaining <= 0) {
                    defaultPoints = 0;
                } else if (config.isInfiniteCap) {
                    defaultPoints = 100;
                }

                let emptyIndex = slots.findIndex(s => s === null);
                if (emptyIndex < 0) {
                    slots.push(null);
                    emptyIndex = slots.length - 1;
                }

                slots[emptyIndex] = {
                    skillName: skillName,
                    points: Math.max(0, defaultPoints), // Mínimo agora é 0
                    category: category
                };
                enforceGlobalCap();
                refreshSkillItemsPlacedState();
                renderSlots();
                updateTotalDisplay();
            }

            function removeSkillFromSlot(slotIndex) {
                if (slots[slotIndex]) {
                    slots[slotIndex] = null;
                    while (slots.length > INITIAL_SLOT_COUNT && slots[slots.length - 1] === null) {
                        slots.pop();
                    }
                    refreshSkillItemsPlacedState();
                    renderSlots();
                    updateTotalDisplay();
                }
            }

            function getRemainingPoints() {
                if (config.isInfiniteCap) return 9999;
                const used = slots.reduce((sum, s) => sum + (s ? s.points : 0), 0);
                return Math.max(0, config.globalCap - used);
            }

            function getTotalUsed() {
                return slots.reduce((sum, s) => sum + (s ? s.points : 0), 0);
            }

            function enforceGlobalCap() {
                if (config.isInfiniteCap) {
                    slots.forEach(s => {
                        if (s && s.points > config.perSkillCap) s.points = config.perSkillCap;
                        if (s && s.points < 0) s.points = 0;
                    });
                    return;
                }

                let total = getTotalUsed();
                while (total > config.globalCap) {
                    for (let i = slots.length - 1; i >= 0; i--) {
                        if (slots[i] && slots[i].points > 0) {
                            const reduction = Math.min(slots[i].points, total - config.globalCap);
                            slots[i].points -= reduction;
                            total -= reduction;
                            if (total <= config.globalCap) break;
                        }
                    }
                    if (total <= config.globalCap) break;
                    slots.forEach(s => { if (s) s.points = 0; });
                    total = getTotalUsed();
                    if (total <= config.globalCap) break;
                    break;
                }
                slots.forEach(s => {
                    if (s && s.points > config.perSkillCap) s.points = config.perSkillCap;
                    if (s && s.points < 0) s.points = 0;
                });
            }

            function changeSkillPoints(slotIndex, delta) {
                if (!slots[slotIndex]) return;
                const newPoints = slots[slotIndex].points + delta;
                if (newPoints < 0) return; // Mínimo agora aceita 0
                if (newPoints > config.perSkillCap) return;

                if (config.isInfiniteCap) {
                    slots[slotIndex].points = newPoints;
                } else {
                    const otherTotal = slots.reduce((sum, s, i) => sum + (i === slotIndex ? 0 : (s ? s.points : 0)), 0);
                    if (otherTotal + newPoints > config.globalCap) {
                        slots[slotIndex].points = Math.max(0, config.globalCap - otherTotal);
                    } else {
                        slots[slotIndex].points = newPoints;
                    }
                }
                enforceGlobalCap();
                renderSlots();
                updateTotalDisplay();
            }

            function renderSlots() {
                slotsGrid.innerHTML = '';
                slots.forEach((slot, index) => {
                    const card = document.createElement('div');
                    card.className = 'slot-card';
                    if (slot) card.classList.add('filled');
                    card.dataset.slotIndex = index;
                    card.addEventListener('dragover', handleSlotDragOver);
                    card.addEventListener('dragleave', handleSlotDragLeave);
                    card.addEventListener('drop', handleSlotDrop);

                    if (slot) {
                        card.innerHTML = `
                            <button class="slot-remove-btn" data-action="remove" data-slot-index="${index}" title="Remover">✕</button>
                            <div class="slot-content">
                                <span class="skill-cat-display">${getCategoryDisplayName(slot.category)}</span>
                                <span class="skill-name-display">${slot.skillName}</span>
                                <div class="points-control">
                                    <button class="points-btn" data-action="decrease" data-slot-index="${index}">−</button>
                                    <span class="points-value">${slot.points.toFixed(1)}</span>
                                    <button class="points-btn" data-action="increase" data-slot-index="${index}">+</button>
                                </div>
                            </div>
                        `;
                    } else {
                        card.innerHTML = `
                            <span class="slot-plus">+</span>
                            <span class="slot-placeholder">Arraste uma<br>habilidade aqui</span>
                        `;
                    }
                    slotsGrid.appendChild(card);
                });
                updateAddSlotButton();
            }

            function updateAddSlotButton() {
                // Mantém o botão visível se puder adicionar, mas agora é complementar
                addSlotBtn.style.display = 'flex';
            }

            function getCategoryDisplayName(catId) {
                const cat = skillCategories.find(c => c.id === catId);
                return cat ? cat.name : '';
            }

            mainContent.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const action = btn.dataset.action;
                const slotIndex = parseInt(btn.dataset.slotIndex);
                if (action === 'remove' && !isNaN(slotIndex)) {
                    removeSkillFromSlot(slotIndex);
                } else if (action === 'increase' && !isNaN(slotIndex)) {
                    changeSkillPoints(slotIndex, 10);
                } else if (action === 'decrease' && !isNaN(slotIndex)) {
                    changeSkillPoints(slotIndex, -10);
                }
            });

            function updateTotalDisplay() {
                const total = getTotalUsed();

                totalUsedEl.textContent = total.toFixed(1);

                // MODIFICADO: Atualização visual com suporte para Cap Infinito
                if (config.isInfiniteCap) {
                    totalCapDisplay.textContent = '∞';
                    gaugePercent.textContent = '∞';
                    ringFill.style.strokeDashoffset = 0;
                    ringFill.classList.remove('warning', 'danger');
                } else {
                    const cap = config.globalCap;
                    const percentage = cap > 0 ? Math.min(100, (total / cap) * 100) : 0;
                    totalCapDisplay.textContent = cap;
                    gaugePercent.textContent = Math.round(percentage) + '%';
                    const circumference = 138.23;
                    const offset = circumference - (percentage / 100) * circumference;
                    ringFill.style.strokeDashoffset = offset;
                    ringFill.classList.remove('warning', 'danger');
                    if (percentage >= 95) ringFill.classList.add('danger');
                    else if (percentage >= 80) ringFill.classList.add('warning');
                }

                const filledCount = slots.filter(s => s !== null).length;
                slotsCountEl.textContent = filledCount + ' habilidade' + (filledCount !== 1 ? 's' : '');
                updateAddSlotButton();
            }

            function updateConfigInputs() {
                globalCapInput.value = config.globalCap;
                globalCapInput.disabled = config.isInfiniteCap; // Desativa se for infinito
                infiniteCapCheckbox.checked = config.isInfiniteCap;
                perSkillCapInput.value = config.perSkillCap;
                statusCapInput.value = config.statusCap;
                individualStatCapInput.value = config.individualStatCap;
                totalCapDisplay.textContent = config.isInfiniteCap ? '∞' : config.globalCap;
                statCapDisplay.textContent = config.statusCap;
            }

            function updateStatusDisplay() {
                const total = strStat + dexStat + intStat;
                statTotalVal.textContent = total;
                statTotalRow.classList.toggle('over', total > config.statusCap);
                statCapDisplay.textContent = config.statusCap;
            }

            function handleGlobalCapChange() {
                if (config.isInfiniteCap) return;
                let val = parseInt(globalCapInput.value);
                if (isNaN(val) || val < 10) val = 10;
                if (val > 5000) val = 5000;
                config.globalCap = val;
                globalCapInput.value = val;
                enforceGlobalCap();
                totalCapDisplay.textContent = val;
                while (slots.length > INITIAL_SLOT_COUNT && slots[slots.length - 1] === null) slots.pop();
                renderSlots();
                updateTotalDisplay();
            }

            function handleInfiniteCapToggle() {
                config.isInfiniteCap = infiniteCapCheckbox.checked;
                globalCapInput.disabled = config.isInfiniteCap;
                enforceGlobalCap();
                renderSlots();
                updateTotalDisplay();
            }

            function handlePerSkillCapChange() {
                let val = parseInt(perSkillCapInput.value);
                if (isNaN(val) || val < 10) val = 10;
                if (val > 500) val = 500;
                config.perSkillCap = val;
                perSkillCapInput.value = val;
                slots.forEach(s => { if (s && s.points > val) s.points = val; });
                enforceGlobalCap();
                renderSlots();
                updateTotalDisplay();
            }

            function handleStatusCapChange() {
                let val = parseInt(statusCapInput.value);
                if (isNaN(val) || val < 10) val = 10;
                if (val > 500) val = 500;
                config.statusCap = val;
                statusCapInput.value = val;
                updateStatusDisplay();
            }

            function handleIndividualStatCapChange() {
                let val = parseInt(individualStatCapInput.value);
                if (isNaN(val) || val < 10) val = 10;
                if (val > 200) val = 200;
                config.individualStatCap = val;
                individualStatCapInput.value = val;
                if (strStat > val) strStat = val;
                if (dexStat > val) dexStat = val;
                if (intStat > val) intStat = val;
                strInput.value = strStat;
                dexInput.value = dexStat;
                intInput.value = intStat;
                updateStatusDisplay();
            }

            function handleStatChange(stat, inputEl) {
                let val = parseInt(inputEl.value);
                if (isNaN(val) || val < 0) val = 0;
                if (val > config.individualStatCap) val = config.individualStatCap;
                inputEl.value = val;
                if (stat === 'str') strStat = val;
                if (stat === 'dex') dexStat = val;
                if (stat === 'int') intStat = val;
                const total = strStat + dexStat + intStat;
                if (total > config.statusCap) {
                    const excess = total - config.statusCap;
                    if (stat === 'str') strStat = Math.max(0, strStat - excess);
                    if (stat === 'dex') dexStat = Math.max(0, dexStat - excess);
                    if (stat === 'int') intStat = Math.max(0, intStat - excess);
                    strInput.value = strStat;
                    dexInput.value = dexStat;
                    intInput.value = intStat;
                }
                updateStatusDisplay();
            }

            function addNewSlot() {
                slots.push(null);
                renderSlots();
                updateTotalDisplay();
            }

            function resetBuild() {
                initSlots();
                refreshSkillItemsPlacedState();
                populateSkillsList(searchInput.value);
                renderSlots();
                updateTotalDisplay();
                strStat = 100;
                dexStat = 100;
                intStat = 25;
                strInput.value = 100;
                dexInput.value = 100;
                intInput.value = 25;
                updateStatusDisplay();
                showToast('Build limpa com sucesso.');
            }

            function exportPDF() {
                const filledSlots = slots.filter(s => s !== null);
                const totalUsed = getTotalUsed();
                const statusTotal = strStat + dexStat + intStat;
                const buildData = {
                    skills: filledSlots.map(s => ({
                        name: s.skillName,
                        points: s.points,
                        category: getCategoryDisplayName(s.category)
                    })),
                    totalPoints: totalUsed,
                    globalCap: config.isInfiniteCap ? '∞' : config.globalCap,
                    perSkillCap: config.perSkillCap,
                    str: strStat,
                    dex: dexStat,
                    int: intStat,
                    statusTotal: statusTotal,
                    statusCap: config.statusCap,
                    date: new Date().toLocaleDateString('pt-BR'),
                };

                const printWin = window.open('', '_blank', 'width=800,height=600');
                if (!printWin) {
                    showToast('Pop-up bloqueado! Permita pop-ups para exportar.', true);
                    return;
                }

                const skillsHTML = buildData.skills.map((s, i) => `
                    <tr>
                        <td class="num-col">${i + 1}</td>
                        <td>${s.name}</td>
                        <td class="cat-col">${s.category}</td>
                        <td class="pts-col">${s.points.toFixed(1)}</td>
                    </tr>
                `).join('');

                printWin.document.write(`
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head><meta charset="UTF-8"><title>UO Build - ${buildData.date}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
                    <style>
                        *{box-sizing:border-box;margin:0;padding:0}
                        body{font-family:'Cormorant Garamond',Garamond,serif;background:#fdfaf3;color:#1a1a1a;padding:40px 50px;max-width:700px;margin:0 auto}
                        .print-header{text-align:center;border-bottom:3px double #8b6918;padding-bottom:18px;margin-bottom:24px}
                        .print-header h1{font-family:'Cinzel',Georgia,serif;font-size:1.6rem;letter-spacing:0.06em;color:#3a2a0a;text-transform:uppercase}
                        .print-header .date{font-style:italic;color:#888;font-size:0.85rem;margin-top:4px}
                        .summary-grid{display:flex;gap:30px;margin-bottom:22px;flex-wrap:wrap}
                        .summary-item{flex:1;min-width:120px;background:#f9f5ec;border:1px solid #e0d5b8;border-radius:8px;padding:12px 16px;text-align:center}
                        .summary-item .label{font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.08em;color:#8b6918;text-transform:uppercase}
                        .summary-item .value{font-family:'JetBrains Mono',monospace;font-size:1.2rem;font-weight:500;color:#2a1a00}
                        table{width:100%;border-collapse:collapse;margin-top:10px}
                        th{font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:0.06em;color:#8b6918;text-transform:uppercase;border-bottom:2px solid #d4c090;padding:8px 10px;text-align:left}
                        td{padding:7px 10px;border-bottom:1px solid #e8e0cc;font-size:0.9rem}
                        .num-col{width:30px;text-align:center;color:#999}
                        .cat-col{color:#8b6918;font-size:0.75rem;font-style:italic}
                        .pts-col{font-family:'JetBrains Mono',monospace;font-weight:500;text-align:right;color:#2a1a00}
                        .footer-note{text-align:center;margin-top:28px;font-style:italic;color:#aaa;font-size:0.8rem;border-top:1px solid #e0d5b8;padding-top:14px}
                        @media print{body{padding:20px 30px;background:#fff}}
                    </style></head>
                    <body>
                        <div class="print-header"><h1>⚔ Ultima Online — Build</h1><p class="date">Exportado em ${buildData.date}</p></div>
                        <div class="summary-grid">
                            <div class="summary-item"><div class="label">Skills Total</div><div class="value">${buildData.totalPoints.toFixed(1)} / ${buildData.globalCap}</div></div>
                            <div class="summary-item"><div class="label">Status</div><div class="value">STR ${buildData.str} · DEX ${buildData.dex} · INT ${buildData.int}</div></div>
                            <div class="summary-item"><div class="label">Status Total</div><div class="value">${buildData.statusTotal} / ${buildData.statusCap}</div></div>
                        </div>
                        <table><thead><tr><th class="num-col">#</th><th>Habilidade</th><th>Categoria</th><th class="pts-col">Pontos</th></tr></thead>
                        <tbody>${skillsHTML || '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">Nenhuma habilidade na build</td></tr>'}</tbody></table>
                        <p class="footer-note">Gerado pelo UO Build Planner — Celestial Codex</p>
                    </body></html>`);
                printWin.document.close();
                setTimeout(() => { printWin.print(); }, 400);
            }

            let toastTimeout;

            function showToast(message, isWarning = false) {
                if (toastTimeout) clearTimeout(toastTimeout);
                toast.textContent = message;
                toast.className = 'toast';
                if (isWarning) toast.classList.add('warning-toast');
                toast.classList.add('show');
                toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
            }

            function bindEvents() {
                searchInput.addEventListener('input', () => {
                    populateSkillsList(searchInput.value);
                    refreshSkillItemsPlacedState();
                });

                // Eventos de drag e drop na GRID global de habilidades
                slotsGrid.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (!e.target.closest('.slot-card')) {
                        slotsGrid.classList.add('grid-drag-over');
                    }
                });

                slotsGrid.addEventListener('dragleave', () => {
                    slotsGrid.classList.remove('grid-drag-over');
                });

                slotsGrid.addEventListener('drop', (e) => {
                    slotsGrid.classList.remove('grid-drag-over');
                    // Garante que só ativa se cair fora de um card existente de skill
                    if (!e.target.closest('.slot-card')) {
                        e.preventDefault();
                        const skillName = e.dataTransfer.getData('text/plain') || draggedSkillName;
                        const cat = draggedCategory || '';
                        if (skillName && !isSkillPlaced(skillName)) {
                            addSkillToSlot(skillName, cat);
                        }
                    }
                });

                globalCapInput.addEventListener('change', handleGlobalCapChange);
                globalCapInput.addEventListener('blur', handleGlobalCapChange);
                infiniteCapCheckbox.addEventListener('change', handleInfiniteCapToggle); // Evento do checkbox infinito
                perSkillCapInput.addEventListener('change', handlePerSkillCapChange);
                perSkillCapInput.addEventListener('blur', handlePerSkillCapChange);
                statusCapInput.addEventListener('change', handleStatusCapChange);
                statusCapInput.addEventListener('blur', handleStatusCapChange);
                individualStatCapInput.addEventListener('change', handleIndividualStatCapChange);
                individualStatCapInput.addEventListener('blur', handleIndividualStatCapChange);
                strInput.addEventListener('change', () => handleStatChange('str', strInput));
                strInput.addEventListener('blur', () => handleStatChange('str', strInput));
                dexInput.addEventListener('change', () => handleStatChange('dex', dexInput));
                dexInput.addEventListener('blur', () => handleStatChange('dex', dexInput));
                intInput.addEventListener('change', () => handleStatChange('int', intInput));
                intInput.addEventListener('blur', () => handleStatChange('int', intInput));
                addSlotBtn.addEventListener('click', addNewSlot);
                exportBtn.addEventListener('click', exportPDF);
                resetBtn.addEventListener('click', resetBuild);
                document.addEventListener('keydown', (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                        e.preventDefault();
                        searchInput.focus();
                        searchInput.select();
                    }
                });
            }

            init();
            populateSkillsList();
            refreshSkillItemsPlacedState();
        })();