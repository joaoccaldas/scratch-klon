function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
    const blockType = ev.dataTransfer.getData("blockType");
    let block;
    if (blockType === "say" || blockType === "wait") {
        const paletteBlock = Array.from(document.querySelectorAll('#block-palette .block')).find(b => b.getAttribute('data-type') === blockType);
        const input = paletteBlock.querySelector('input');
        const value = input ? input.value : '';
        block = document.createElement("div");
        block.className = "block";
        block.setAttribute("data-type", blockType);
        block.dataset.blockId = Date.now() + Math.random();
        if (blockType === "say") {
            block.innerHTML = `säg <input type='text' value='Hej!' style='width:60px;' autocomplete='off'> i <input type='number' min='0.1' step='0.1' value='${value}' style='width:40px;' autocomplete='off'> sekunder`;
            block.style.background = '#ffd54f';
            block.style.borderColor = '#ffb300';
        } else {
            block.innerHTML = `vänta <input type='number' min='0.1' step='0.1' value='${value}' style='width:40px;' autocomplete='off'> sekunder`;
            block.style.background = '#ffd54f';
            block.style.borderColor = '#ffb300';
        }
    } else if (blockType === "repeat") {
        block = document.createElement("div");
        block.className = "block";
        block.setAttribute("data-type", blockType);
        block.dataset.blockId = Date.now() + Math.random();
        block.innerHTML = `upprepa <input type='number' min='1' step='1' value='10' style='width:40px;' autocomplete='off'> gånger`;
        block.style.background = '#90caf9';
        block.style.borderColor = '#1976d2';
    } else if (blockType === "move") {
        block = document.createElement("div");
        block.className = "block";
        block.setAttribute("data-type", blockType);
        block.dataset.blockId = Date.now() + Math.random();
        block.innerHTML = `gå <input type='number' value='10' style='width:40px;' autocomplete='off'> steg x <input type='number' value='0' style='width:40px;' autocomplete='off'> y <input type='number' value='0' style='width:40px;' autocomplete='off'>`;
        block.style.background = '#b39ddb';
        block.style.borderColor = '#7c4dff';
    } else if (blockType === "turnR") {
        block = document.createElement("div");
        block.className = "block";
        block.setAttribute("data-type", blockType);
        block.dataset.blockId = Date.now() + Math.random();
        block.innerHTML = `rotera ↻ <input type='number' value='15' style='width:40px;' autocomplete='off'> grader`;
        block.style.background = '#b39ddb';
        block.style.borderColor = '#7c4dff';
    } else if (blockType === "turnL") {
        block = document.createElement("div");
        block.className = "block";
        block.setAttribute("data-type", blockType);
        block.dataset.blockId = Date.now() + Math.random();
        block.innerHTML = `rotera ↺ <input type='number' value='15' style='width:40px;' autocomplete='off'> grader`;
        block.style.background = '#b39ddb';
        block.style.borderColor = '#7c4dff';
    } else {
        block = document.createElement("div");
        block.className = "block";
        block.textContent = ev.dataTransfer.getData("text");
        block.setAttribute("data-type", blockType);
        block.dataset.blockId = Date.now() + Math.random();
        if (["move","turnR","turnL","goto"].includes(blockType)) {
            block.style.background = '#b39ddb';
            block.style.borderColor = '#7c4dff';
        } else if (["repeat","if","end"].includes(blockType)) {
            block.style.background = '#90caf9';
            block.style.borderColor = '#1976d2';
        }
    }
    // Förhindra att input-fält triggar drag/dubbelklick
    block.querySelectorAll('input').forEach(input => {
        input.addEventListener('mousedown', e => e.stopPropagation());
        input.addEventListener('dblclick', e => e.stopPropagation());
        input.addEventListener('dragstart', e => e.stopPropagation());
    });
    document.getElementById("workspace").appendChild(block);
    makeWorkspaceBlocksDraggable();
}

// Gör så att block kan raderas genom att dra dem till paletten
const blockPalette = document.getElementById('block-palette');
blockPalette.addEventListener('dragover', function(ev) {
    ev.preventDefault();
});
blockPalette.addEventListener('drop', function(ev) {
    ev.preventDefault();
    // Hitta block i workspace med blockId
    const blockId = ev.dataTransfer.getData('blockId');
    if (blockId) {
        const workspaceBlocks = document.querySelectorAll('#workspace .block');
        workspaceBlocks.forEach(block => {
            if (block.dataset.blockId === blockId) {
                block.remove();
            }
        });
    }
});

document.querySelectorAll('#block-palette .block').forEach(block => {
    block.addEventListener('dragstart', function(ev) {
        ev.dataTransfer.setData("text", block.textContent);
        ev.dataTransfer.setData("blockType", block.getAttribute("data-type"));
    });
});

// Modifiera dragstart för workspace-blocks så att blockId sätts
function makeWorkspaceBlocksDraggable() {
    document.querySelectorAll('#workspace .block').forEach(block => {
        block.draggable = true;
        block.addEventListener('dragstart', function(ev) {
            ev.dataTransfer.setData("text", block.textContent);
            ev.dataTransfer.setData("blockType", block.getAttribute("data-type"));
            ev.dataTransfer.setData("blockId", block.dataset.blockId);
        });
        block.addEventListener('dblclick', function() {
            block.remove();
        });
    });
}

let running = false;
let currentTimeouts = [];
let kontpassAnswer = '';
let kontpassLists = {};
function updateListPanel() {
    const panel = document.getElementById('listPanel');
    if (!panel) return;
    const names = Object.keys(kontpassLists);
    if (names.length === 0) {
        panel.style.display = 'none';
        panel.innerHTML = '';
        return;
    }
    panel.style.display = 'block';
    panel.style.background = '#ffe082'; // classic yellow
    panel.style.border = '2px solid #ffb300';
    panel.style.borderRadius = '6px';
    panel.style.fontFamily = '"Press Start 2P", "VT323", monospace';
    panel.style.fontSize = '0.95em';
    panel.style.color = '#222';
    panel.style.boxShadow = '2px 2px 0 #ffb300, 4px 4px 0 #fffde7';
    panel.innerHTML = names.map(name => {
        const items = kontpassLists[name].map(item => `<div style='margin-left:12px; background:#fffde7; border:1px solid #ffb300; border-radius:3px; padding:2px 6px; margin-bottom:2px; display:inline-block;'>${item}</div>`).join(' ');
        return `<div style='font-weight:bold; margin-bottom:2px; color:#ad6800;'>${name}</div><div style='font-size:0.9em; margin-bottom:2px;'>det som finns i listan:</div>${items}`;
    }).join('<hr style="border:none; border-top:1px solid #ffb300; margin:6px 0;">');
}

function stopBlocks() {
    running = false;
    currentTimeouts.forEach(t => clearTimeout(t));
    currentTimeouts = [];
    const sprite = document.getElementById('sprite');
    sprite.style.left = '140px';
    sprite.style.top = '100px';
    sprite.dataset.direction = 90;
    const sayBox = document.getElementById('sayBox');
    if (sayBox) sayBox.style.display = 'none';
}

function runBlocks() {
    stopBlocks(); // Återställ och stoppa allt
    running = true;
    const sprite = document.getElementById('sprite');
    let x = 140;
    let y = 100;
    let direction = 0; // Starta alltid med 0 grader
    let sayBox = document.getElementById('sayBox');
    if (!sayBox) {
        sayBox = document.createElement('div');
        sayBox.id = 'sayBox';
        sayBox.style.position = 'absolute';
        sayBox.style.background = '#fff';
        sayBox.style.border = '2px solid #888';
        sayBox.style.borderRadius = '8px';
        sayBox.style.padding = '6px 12px';
        sayBox.style.fontSize = '1em';
        sayBox.style.zIndex = 2;
        sayBox.style.display = 'none';
        document.getElementById('stage').appendChild(sayBox);
    }
    sayBox.style.display = 'none';
    sprite.style.left = x + 'px';
    sprite.style.top = y + 'px';
    sprite.dataset.direction = direction;
    sprite.style.transform = `rotate(${direction}deg)`;
    // Remove lists that don't have a 'skapa lista' block in the workspace
    const blocks = Array.from(document.querySelectorAll('#workspace .block'));
    // --- GAMEKEY SUPPORT ---
    let gamekeyBlocks = [];
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].getAttribute('data-type') === 'gamekey') {
            let keySel = blocks[i].querySelector('select');
            let key = keySel ? keySel.value : '';
            let body = [];
            let j = i + 1;
            while (j < blocks.length && blocks[j].getAttribute('data-type') !== 'gamekey') {
                body.push(blocks[j]);
                j++;
            }
            gamekeyBlocks.push({ key, body });
        }
    }
    // Listen for keydown events
    window.onkeydown = function(e) {
        if (!running) return;
        for (let gk of gamekeyBlocks) {
            // Compare lowercased key values for reliability
            let selectedKey = (gk.key || '').toLowerCase();
            let pressedKey = (e.key || '').toLowerCase();
            // Special handling for space
            if ((selectedKey === ' ' && (pressedKey === ' ' || pressedKey === 'spacebar')) || selectedKey === pressedKey) {
                runGamekeyBody(gk.body);
            }
        }
    };
    // If no gamekey blocks, run as normal
    if (gamekeyBlocks.length === 0) {
        // Remove lists that don't have a 'skapa lista' block in the workspace
        const listBlocks = blocks.filter(b => b.getAttribute('data-type') === 'list');
        const validLists = listBlocks.map(b => {
            const input = b.querySelector('input');
            return input ? input.value : 'minLista';
        });
        Object.keys(kontpassLists).forEach(name => {
            if (!validLists.includes(name)) {
                delete kontpassLists[name];
            }
        });
        updateListPanel(); // Clear or show lists at start
        if (blocks.length === 0) return;
        let i = 0;
        function updateSayBoxPosition() {
            sayBox.style.left = (x + 40) + 'px';
            sayBox.style.top = (y - 20) + 'px';
        }
        function evalIfExpr(expr) {
            expr = expr.trim();
            let result = false;
            try {
                // Byt ut = mot == om det är ett enda likhetstecken
                expr = expr.replace(/([^=<>!])=([^=])/g, '$1==$2');
                let match = expr.match(/^(.*?)([=<>!]=?|>=|<=)(.*)$/);
                if (match) {
                    let left = match[1].trim();
                    let op = match[2].trim();
                    let right = match[3].trim();
                    // Ersätt 'svar' med kontpassAnswer
                    left = left.replace(/svar/g, kontpassAnswer);
                    right = right.replace(/svar/g, kontpassAnswer);
                    let leftVal = Function('return (' + left + ')')();
                    let rightVal = Function('return (' + right + ')')();
                    switch(op) {
                        case '==':
                            result = leftVal == rightVal; break;
                        case '!=':
                            result = leftVal != rightVal; break;
                        case '<':
                            result = leftVal < rightVal; break;
                        case '>':
                            result = leftVal > rightVal; break;
                        case '<=':
                            result = leftVal <= rightVal; break;
                        case '>=':
                            result = leftVal >= rightVal; break;
                        default:
                            result = false;
                    }
                } else {
                    // Ersätt 'svar' med kontpassAnswer
                    expr = expr.replace(/svar/g, kontpassAnswer);
                    result = !!Function('return (' + expr + ')')();
                }
            } catch (err) {
                result = false;
            }
            return result;
        }
        function executeBlock() {
            if (!running) return;
            if (i >= blocks.length) return;
            let block = blocks[i];
            let type = block.getAttribute('data-type');
            switch(type) {
                case 'move':
                    const moveInputs = block.querySelectorAll('input');
                    const moveSteps = moveInputs[0] ? parseFloat(moveInputs[0].value) : 10;
                    const moveX = moveInputs[1] ? parseFloat(moveInputs[1].value) : 0;
                    const moveY = moveInputs[2] ? parseFloat(moveInputs[2].value) : 0;
                    x += moveSteps * Math.cos(direction * Math.PI/180) + moveX;
                    y += moveSteps * Math.sin(direction * Math.PI/180) + moveY;
                    sprite.style.left = x + 'px';
                    sprite.style.top = y + 'px';
                    updateSayBoxPosition();
                    i++;
                    executeBlock();
                    break;
                case 'turnR':
                    const turnRInput = block.querySelector('input');
                    const turnRValue = turnRInput ? parseFloat(turnRInput.value) : 15;
                    direction += turnRValue;
                    sprite.dataset.direction = direction;
                    sprite.style.transform = `rotate(${direction}deg)`;
                    updateSayBoxPosition();
                    i++;
                    executeBlock();
                    break;
                case 'turnL':
                    const turnLInput = block.querySelector('input');
                    const turnLValue = turnLInput ? parseFloat(turnLInput.value) : 15;
                    direction -= turnLValue;
                    sprite.dataset.direction = direction;
                    sprite.style.transform = `rotate(${direction}deg)`;
                    updateSayBoxPosition();
                    i++;
                    executeBlock();
                    break;
                case 'goto':
                    x = Math.floor(Math.random()*240);
                    y = Math.floor(Math.random()*180);
                    sprite.style.left = x + 'px';
                    sprite.style.top = y + 'px';
                    updateSayBoxPosition();
                    i++;
                    executeBlock();
                    break;
                case 'say':
                    const sayInputs = block.querySelectorAll('input');
                    const sayText = sayInputs[0] ? sayInputs[0].value : 'Hej!';
                    const sayTime = sayInputs[1] ? parseFloat(sayInputs[1].value) : 2;
                    sayBox.textContent = sayText;
                    sayBox.style.display = 'block';
                    updateSayBoxPosition();
                    let t1 = setTimeout(() => {
                        sayBox.style.display = 'none';
                        i++;
                        executeBlock();
                    }, sayTime * 1000);
                    currentTimeouts.push(t1);
                    break;
                case 'wait':
                    const waitInput = block.querySelector('input');
                    const waitTime = waitInput ? parseFloat(waitInput.value) : 1;
                    let t2 = setTimeout(() => {
                        i++;
                        executeBlock();
                    }, waitTime * 1000);
                    currentTimeouts.push(t2);
                    break;
                case 'repeat':
                    let repeatBody = [];
                    let j = i+1;
                    while(j < blocks.length && blocks[j].getAttribute('data-type') !== 'end') {
                        repeatBody.push(blocks[j]);
                        j++;
                    }
                    const repeatInput = block.querySelector('input');
                    const repeatTimes = repeatInput ? parseInt(repeatInput.value) : 10;
                    function repeatLoop(count) {
                        if (!running) return;
                        if(count >= repeatTimes) {
                            i = j+1;
                            executeBlock();
                            return;
                        }
                        let k = 0;
                        function runBody() {
                            if (!running) return;
                            if(k >= repeatBody.length) {
                                repeatLoop(count+1);
                                return;
                            }
                            let tempBlock = repeatBody[k];
                            let tempType = tempBlock.getAttribute('data-type');
                            switch(tempType) {
                                case 'move':
                                    const moveInputs = tempBlock.querySelectorAll('input');
                                    const moveSteps = moveInputs[0] ? parseFloat(moveInputs[0].value) : 10;
                                    const moveX = moveInputs[1] ? parseFloat(moveInputs[1].value) : 0;
                                    const moveY = moveInputs[2] ? parseFloat(moveInputs[2].value) : 0;
                                    x += moveSteps * Math.cos(direction * Math.PI/180) + moveX;
                                    y += moveSteps * Math.sin(direction * Math.PI/180) + moveY;
                                    sprite.style.left = x + 'px';
                                    sprite.style.top = y + 'px';
                                    sprite.style.transform = `rotate(${direction}deg)`;
                                    updateSayBoxPosition();
                                    k++;
                                    runBody();
                                    break;
                                case 'turnR':
                                    const turnRInput = tempBlock.querySelector('input');
                                    const turnRValue = turnRInput ? parseFloat(turnRInput.value) : 15;
                                    direction += turnRValue;
                                    sprite.dataset.direction = direction;
                                    sprite.style.transform = `rotate(${direction}deg)`;
                                    updateSayBoxPosition();
                                    k++;
                                    runBody();
                                    break;
                                case 'turnL':
                                    const turnLInput = tempBlock.querySelector('input');
                                    const turnLValue = turnLInput ? parseFloat(turnLInput.value) : 15;
                                    direction -= turnLValue;
                                    sprite.dataset.direction = direction;
                                    sprite.style.transform = `rotate(${direction}deg)`;
                                    updateSayBoxPosition();
                                    k++;
                                    runBody();
                                    break;
                                case 'goto':
                                    x = Math.floor(Math.random()*240);
                                    y = Math.floor(Math.random()*180);
                                    sprite.style.left = x + 'px';
                                    sprite.style.top = y + 'px';
                                    updateSayBoxPosition();
                                    k++;
                                    runBody();
                                    break;
                                case 'say':
                                    const sayInputs = tempBlock.querySelectorAll('input');
                                    const sayText = sayInputs[0] ? sayInputs[0].value : 'Hej!';
                                    const sayTime = sayInputs[1] ? parseFloat(sayInputs[1].value) : 2;
                                    sayBox.textContent = sayText;
                                    sayBox.style.display = 'block';
                                    updateSayBoxPosition();
                                    let t3 = setTimeout(() => {
                                        sayBox.style.display = 'none';
                                        k++;
                                        runBody();
                                    }, sayTime * 1000);
                                    currentTimeouts.push(t3);
                                    break;
                                case 'wait':
                                    const waitInput = tempBlock.querySelector('input');
                                    const waitTime = waitInput ? parseFloat(waitInput.value) : 1;
                                    let t4 = setTimeout(() => {
                                        k++;
                                        runBody();
                                    }, waitTime * 1000);
                                    currentTimeouts.push(t4);
                                    break;
                                default:
                                    k++;
                                    runBody();
                            }
                        }
                        runBody();
                    }
                    repeatLoop(0);
                    break;
                case 'if':
                    const ifInput = block.querySelector('input');
                    const ifExpr = ifInput ? ifInput.value : '';
                    const ifResult = evalIfExpr(ifExpr);
                    sayBox.textContent = ifResult ? 'true' : 'false';
                    sayBox.style.display = 'block';
                    updateSayBoxPosition();
                    let tIf = setTimeout(() => {
                        sayBox.style.display = 'none';
                        i++;
                        executeBlock();
                    }, 1500);
                    currentTimeouts.push(tIf);
                    break;
                case 'end':
                    i++;
                    executeBlock();
                    break;
                case 'ask': {
                    const askInput = block.querySelector('input');
                    const askText = askInput ? askInput.value : 'Vad heter du?';
                    sayBox.textContent = askText;
                    sayBox.style.display = 'block';
                    updateSayBoxPosition();
                    setTimeout(() => {
                        sayBox.style.display = 'none';
                        setTimeout(() => {
                            kontpassAnswer = prompt(askText) || '';
                            i++;
                            executeBlock();
                        }, 200);
                    }, 1000);
                    break;
                }
                case 'answer': {
                    sayBox.textContent = kontpassAnswer;
                    sayBox.style.display = 'block';
                    updateSayBoxPosition();
                    setTimeout(() => {
                        sayBox.style.display = 'none';
                        i++;
                        executeBlock();
                    }, 1200);
                    break;
                }
                case 'list': {
                    const listInput = block.querySelector('input');
                    const listName = listInput ? listInput.value : 'minLista';
                    if (!kontpassLists[listName]) kontpassLists[listName] = [];
                    updateListPanel();
                    i++;
                    executeBlock();
                    break;
                }
                case 'addtolist': {
                    const addInputs = block.querySelectorAll('input');
                    let value = addInputs[0] ? addInputs[0].value : '';
                    const listName = addInputs[1] ? addInputs[1].value : 'minLista';
                    // If value is 'svar', use kontpassAnswer
                    if (value.trim() === 'svar') value = kontpassAnswer;
                    if (!kontpassLists[listName]) kontpassLists[listName] = [];
                    kontpassLists[listName].push(value);
                    updateListPanel();
                    i++;
                    executeBlock();
                    break;
                }
                default:
                    i++;
                    executeBlock();
            }
        }
        executeBlock();
    }
}
function runGamekeyBody(blocks) {
    let i = 0;
    function executeBlock() {
        if (!running) return;
        if (i >= blocks.length) return;
        let block = blocks[i];
        let type = block.getAttribute('data-type');
        switch(type) {
            case 'move':
                const moveInputs = block.querySelectorAll('input');
                const moveSteps = moveInputs[0] ? parseFloat(moveInputs[0].value) : 10;
                const moveX = moveInputs[1] ? parseFloat(moveInputs[1].value) : 0;
                const moveY = moveInputs[2] ? parseFloat(moveInputs[2].value) : 0;
                x += moveSteps * Math.cos(direction * Math.PI/180) + moveX;
                y += moveSteps * Math.sin(direction * Math.PI/180) + moveY;
                sprite.style.left = x + 'px';
                sprite.style.top = y + 'px';
                updateSayBoxPosition();
                i++;
                executeBlock();
                break;
            case 'turnR':
                const turnRInput = block.querySelector('input');
                const turnRValue = turnRInput ? parseFloat(turnRInput.value) : 15;
                direction += turnRValue;
                sprite.dataset.direction = direction;
                sprite.style.transform = `rotate(${direction}deg)`;
                updateSayBoxPosition();
                i++;
                executeBlock();
                break;
            case 'turnL':
                const turnLInput = block.querySelector('input');
                const turnLValue = turnLInput ? parseFloat(turnLInput.value) : 15;
                direction -= turnLValue;
                sprite.dataset.direction = direction;
                sprite.style.transform = `rotate(${direction}deg)`;
                updateSayBoxPosition();
                i++;
                executeBlock();
                break;
            case 'goto':
                x = Math.floor(Math.random()*240);
                y = Math.floor(Math.random()*180);
                sprite.style.left = x + 'px';
                sprite.style.top = y + 'px';
                updateSayBoxPosition();
                i++;
                executeBlock();
                break;
            case 'say':
                const sayInputs = block.querySelectorAll('input');
                const sayText = sayInputs[0] ? sayInputs[0].value : 'Hej!';
                const sayTime = sayInputs[1] ? parseFloat(sayInputs[1].value) : 2;
                sayBox.textContent = sayText;
                sayBox.style.display = 'block';
                updateSayBoxPosition();
                let t1 = setTimeout(() => {
                    sayBox.style.display = 'none';
                    i++;
                    executeBlock();
                }, sayTime * 1000);
                currentTimeouts.push(t1);
                break;
            case 'wait':
                const waitInput = block.querySelector('input');
                const waitTime = waitInput ? parseFloat(waitInput.value) : 1;
                let t2 = setTimeout(() => {
                    i++;
                    executeBlock();
                }, waitTime * 1000);
                currentTimeouts.push(t2);
                break;
            case 'repeat':
                let repeatBody = [];
                let j = i+1;
                while(j < blocks.length && blocks[j].getAttribute('data-type') !== 'end') {
                    repeatBody.push(blocks[j]);
                    j++;
                }
                const repeatInput = block.querySelector('input');
                const repeatTimes = repeatInput ? parseInt(repeatInput.value) : 10;
                function repeatLoop(count) {
                    if (!running) return;
                    if(count >= repeatTimes) {
                        i = j+1;
                        executeBlock();
                        return;
                    }
                    let k = 0;
                    function runBody() {
                        if (!running) return;
                        if(k >= repeatBody.length) {
                            repeatLoop(count+1);
                            return;
                        }
                        let tempBlock = repeatBody[k];
                        let tempType = tempBlock.getAttribute('data-type');
                        switch(tempType) {
                            case 'move':
                                const moveInputs = tempBlock.querySelectorAll('input');
                                const moveSteps = moveInputs[0] ? parseFloat(moveInputs[0].value) : 10;
                                const moveX = moveInputs[1] ? parseFloat(moveInputs[1].value) : 0;
                                const moveY = moveInputs[2] ? parseFloat(moveInputs[2].value) : 0;
                                x += moveSteps * Math.cos(direction * Math.PI/180) + moveX;
                                y += moveSteps * Math.sin(direction * Math.PI/180) + moveY;
                                sprite.style.left = x + 'px';
                                sprite.style.top = y + 'px';
                                sprite.style.transform = `rotate(${direction}deg)`;
                                updateSayBoxPosition();
                                k++;
                                runBody();
                                break;
                            case 'turnR':
                                const turnRInput = tempBlock.querySelector('input');
                                const turnRValue = turnRInput ? parseFloat(turnRInput.value) : 15;
                                direction += turnRValue;
                                sprite.dataset.direction = direction;
                                sprite.style.transform = `rotate(${direction}deg)`;
                                updateSayBoxPosition();
                                k++;
                                runBody();
                                break;
                            case 'turnL':
                                const turnLInput = tempBlock.querySelector('input');
                                const turnLValue = turnLInput ? parseFloat(turnLInput.value) : 15;
                                direction -= turnLValue;
                                sprite.dataset.direction = direction;
                                sprite.style.transform = `rotate(${direction}deg)`;
                                updateSayBoxPosition();
                                k++;
                                runBody();
                                break;
                            case 'goto':
                                x = Math.floor(Math.random()*240);
                                y = Math.floor(Math.random()*180);
                                sprite.style.left = x + 'px';
                                sprite.style.top = y + 'px';
                                updateSayBoxPosition();
                                k++;
                                runBody();
                                break;
                            case 'say':
                                const sayInputs = tempBlock.querySelectorAll('input');
                                const sayText = sayInputs[0] ? sayInputs[0].value : 'Hej!';
                                const sayTime = sayInputs[1] ? parseFloat(sayInputs[1].value) : 2;
                                sayBox.textContent = sayText;
                                sayBox.style.display = 'block';
                                updateSayBoxPosition();
                                let t3 = setTimeout(() => {
                                    sayBox.style.display = 'none';
                                    k++;
                                    runBody();
                                }, sayTime * 1000);
                                currentTimeouts.push(t3);
                                break;
                            case 'wait':
                                const waitInput = tempBlock.querySelector('input');
                                const waitTime = waitInput ? parseFloat(waitInput.value) : 1;
                                let t4 = setTimeout(() => {
                                    k++;
                                    runBody();
                                }, waitTime * 1000);
                                currentTimeouts.push(t4);
                                break;
                            default:
                                k++;
                                runBody();
                        }
                    }
                    runBody();
                }
                repeatLoop(0);
                break;
            case 'if':
                const ifInput = block.querySelector('input');
                const ifExpr = ifInput ? ifInput.value : '';
                const ifResult = evalIfExpr(ifExpr);
                sayBox.textContent = ifResult ? 'true' : 'false';
                sayBox.style.display = 'block';
                updateSayBoxPosition();
                let tIf = setTimeout(() => {
                    sayBox.style.display = 'none';
                    i++;
                    executeBlock();
                }, 1500);
                currentTimeouts.push(tIf);
                break;
            case 'end':
                i++;
                executeBlock();
                break;
            case 'ask': {
                const askInput = block.querySelector('input');
                const askText = askInput ? askInput.value : 'Vad heter du?';
                sayBox.textContent = askText;
                sayBox.style.display = 'block';
                updateSayBoxPosition();
                setTimeout(() => {
                    sayBox.style.display = 'none';
                    setTimeout(() => {
                        kontpassAnswer = prompt(askText) || '';
                        i++;
                        executeBlock();
                    }, 200);
                }, 1000);
                break;
            }
            case 'answer': {
                sayBox.textContent = kontpassAnswer;
                sayBox.style.display = 'block';
                updateSayBoxPosition();
                setTimeout(() => {
                    sayBox.style.display = 'none';
                    i++;
                    executeBlock();
                }, 1200);
                break;
            }
            case 'list': {
                const listInput = block.querySelector('input');
                const listName = listInput ? listInput.value : 'minLista';
                if (!kontpassLists[listName]) kontpassLists[listName] = [];
                updateListPanel();
                i++;
                executeBlock();
                break;
            }
            case 'addtolist': {
                const addInputs = block.querySelectorAll('input');
                let value = addInputs[0] ? addInputs[0].value : '';
                const listName = addInputs[1] ? addInputs[1].value : 'minLista';
                // If value is 'svar', use kontpassAnswer
                if (value.trim() === 'svar') value = kontpassAnswer;
                if (!kontpassLists[listName]) kontpassLists[listName] = [];
                kontpassLists[listName].push(value);
                updateListPanel();
                i++;
                executeBlock();
                break;
            }
            default:
                i++;
                executeBlock();
        }
    }
    executeBlock();
}
// --- Save to localStorage with name/author ---
function saveGameToLocal() {
    let name = prompt('Vad ska spelet heta?');
    if (!name) return;
    let author = localStorage.getItem('workhud_author');
    if (!author) {
        author = prompt('Vad heter du? (Författare)');
        if (!author) return;
        localStorage.setItem('workhud_author', author);
    }
    const blocks = Array.from(document.querySelectorAll('#workspace .block'));
    const blockData = blocks.map(block => {
        const type = block.getAttribute('data-type');
        const inputs = Array.from(block.querySelectorAll('input')).map(input => input.value);
        return { type, inputs };
    });
    // Hämta bakgrundsfärg från färgväljaren
    const bgColor = document.getElementById('bgColorPicker') ? document.getElementById('bgColorPicker').value : '#222222';
    const game = { name, author, blocks: blockData, bgColor };
    localStorage.setItem('workhud_game_' + name, JSON.stringify(game));
    alert('Spelet sparat!');
}
document.getElementById('loadGameBtn').onclick = function() {
    let name = prompt('Vad heter spelet du vill ladda?');
    if (!name) return;
    let author = localStorage.getItem('workhud_author');
    if (!author) {
        author = prompt('Vad heter du? (Författare)');
        if (!author) return;
        localStorage.setItem('workhud_author', author);
    }
    const key = 'workhud_game_' + name;
    const data = localStorage.getItem(key);
    if (!data) {
        alert('Spelet hittades inte!');
        return;
    }
    try {
        const game = JSON.parse(data);
        if (!game.blocks) throw new Error('Fel format');
        document.getElementById('workspace').innerHTML = '';
        game.blocks.forEach(b => {
            let paletteBlock = document.querySelector(`#block-palette .block[data-type='${b.type}']`);
            if (!paletteBlock) return;
            let block = paletteBlock.cloneNode(true);
            block.dataset.blockId = Date.now() + Math.random();
            let blockInputs = block.querySelectorAll('input');
            (b.inputs||[]).forEach((val, idx) => {
                if (blockInputs[idx]) blockInputs[idx].value = val;
            });
            document.getElementById('workspace').appendChild(block);
        });
        makeWorkspaceBlocksDraggable();
        // Ladda bakgrundsfärg om den finns
        if (game.bgColor) {
            const bgColorPicker = document.getElementById('bgColorPicker');
            const stage = document.getElementById('stage');
            if (bgColorPicker && stage) {
                bgColorPicker.value = game.bgColor;
                stage.style.background = game.bgColor;
            }
        }
        alert('Spelet laddat!');
    } catch (err) {
        alert('Kunde inte ladda spelet: ' + err.message);
    }
};
// --- Save to localStorage button (optional, for menu) ---
// You can add a button for this if you want:
// <button onclick="saveGameToLocal()">Spara till Mina Spel</button>
// --- Load game from URL param ---
(function() {
    const params = new URLSearchParams(window.location.search);
    const gameName = params.get('game');
    if (gameName) {
        const key = 'workhud_game_' + gameName;
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const game = JSON.parse(data);
                if (game.blocks) {
                    document.getElementById('workspace').innerHTML = '';
                    game.blocks.forEach(b => {
                        let paletteBlock = document.querySelector(`#block-palette .block[data-type='${b.type}']`);
                        if (!paletteBlock) return;
                        let block = paletteBlock.cloneNode(true);
                        block.dataset.blockId = Date.now() + Math.random();
                        let blockInputs = block.querySelectorAll('input');
                        (b.inputs||[]).forEach((val, idx) => {
                            if (blockInputs[idx]) blockInputs[idx].value = val;
                        });
                        document.getElementById('workspace').appendChild(block);
                    });
                    makeWorkspaceBlocksDraggable();
                }
            } catch {}
        }
    }
})();

document.getElementById('publishGameBtn').onclick = function() {
    let name = prompt('Vad ska spelet heta?');
    if (!name) return;
    let author = localStorage.getItem('workhud_author');
    if (!author) {
        author = prompt('Vad heter du? (Författare)');
        if (!author) return;
        localStorage.setItem('workhud_author', author);
    }
    const blocks = Array.from(document.querySelectorAll('#workspace .block'));
    const blockData = blocks.map(block => {
        const type = block.getAttribute('data-type');
        const inputs = Array.from(block.querySelectorAll('input')).map(input => input.value);
        return { type, inputs };
    });
    const game = { name, author, blocks: blockData };
    localStorage.setItem('workhud_game_' + name, JSON.stringify(game));
    alert('Spelet är nu publicerat och syns för alla på startsidan!');
    window.location = 'home.html'; // Gå automatiskt till home
};
