// Enkel "spelvisare" för WorkHud
// Visar och kör ett spel utan att kunna ändra blocken

let kontpassAnswer = '';
let kontpassLists = {};
let running = false;
let currentTimeouts = [];

function updateListPanel() {
    const panel = document.getElementById('listPanel');
    if (!panel) return;
    const names = Object.keys(kontpassLists);
    if (names.length === 0) {
        panel.style.display = 'none';
        panel.innerHTML = '';
        return;
    }
    // Use language string for 'items in list'
    let lang = localStorage.getItem('workhud_lang') || 'sv';
    let itemsInListLabel = (window.workhudLangStrings && window.workhudLangStrings[lang] && window.workhudLangStrings[lang].itemsInList) ? window.workhudLangStrings[lang].itemsInList : 'det som finns i listan:';
    panel.style.display = 'block';
    panel.style.background = '#ffe082';
    panel.style.border = '2px solid #ffb300';
    panel.style.borderRadius = '6px';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '0.95em';
    panel.style.color = '#222';
    panel.style.boxShadow = '2px 2px 0 #ffb300, 4px 4px 0 #fffde7';
    panel.innerHTML = names.map(name => {
        const items = kontpassLists[name].map(item => `<div style='margin-left:12px; background:#fffde7; border:1px solid #ffb300; border-radius:3px; padding:2px 6px; margin-bottom:2px; display:inline-block;'>${item}</div>`).join(' ');
        return `<div style='font-weight:bold; margin-bottom:2px; color:#ad6800;'>${name}</div><div style='font-size:0.9em; margin-bottom:2px;'>${itemsInListLabel}</div>${items}`;
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

function runBlocks(blocks) {
    stopBlocks();
    running = true;
    const sprite = document.getElementById('sprite');
    let x = 140;
    let y = 100;
    let direction = 0;
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
    updateListPanel();
    if (!blocks || blocks.length === 0) return;
    let i = 0;
    function updateSayBoxPosition() {
        sayBox.style.left = (x + 40) + 'px';
        sayBox.style.top = (y - 20) + 'px';
    }
    function evalIfExpr(expr) {
        expr = expr.trim();
        let result = false;
        try {
            expr = expr.replace(/([^=<>!])=([^=])/g, '$1==$2');
            let match = expr.match(/^(.*?)([=<>!]=?|>=|<=)(.*)$/);
            if (match) {
                let left = match[1].trim();
                let op = match[2].trim();
                let right = match[3].trim();
                left = left.replace(/svar/g, kontpassAnswer);
                right = right.replace(/svar/g, kontpassAnswer);
                let leftVal = Function('return (' + left + ')')();
                let rightVal = Function('return (' + right + ')')();
                switch(op) {
                    case '==': result = leftVal == rightVal; break;
                    case '!=': result = leftVal != rightVal; break;
                    case '<': result = leftVal < rightVal; break;
                    case '>': result = leftVal > rightVal; break;
                    case '<=': result = leftVal <= rightVal; break;
                    case '>=': result = leftVal >= rightVal; break;
                    default: result = false;
                }
            } else {
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
        let type = block.type;
        switch(type) {
            case 'move': {
                const moveSteps = block.inputs[0] ? parseFloat(block.inputs[0]) : 10;
                const moveX = block.inputs[1] ? parseFloat(block.inputs[1]) : 0;
                const moveY = block.inputs[2] ? parseFloat(block.inputs[2]) : 0;
                x += moveSteps * Math.cos(direction * Math.PI/180) + moveX;
                y += moveSteps * Math.sin(direction * Math.PI/180) + moveY;
                sprite.style.left = x + 'px';
                sprite.style.top = y + 'px';
                updateSayBoxPosition();
                i++;
                executeBlock();
                break;
            }
            case 'turnR': {
                const turnRValue = block.inputs[0] ? parseFloat(block.inputs[0]) : 15;
                direction += turnRValue;
                sprite.dataset.direction = direction;
                sprite.style.transform = `rotate(${direction}deg)`;
                updateSayBoxPosition();
                i++;
                executeBlock();
                break;
            }
            case 'turnL': {
                const turnLValue = block.inputs[0] ? parseFloat(block.inputs[0]) : 15;
                direction -= turnLValue;
                sprite.dataset.direction = direction;
                sprite.style.transform = `rotate(${direction}deg)`;
                updateSayBoxPosition();
                i++;
                executeBlock();
                break;
            }
            case 'goto': {
                x = Math.floor(Math.random()*240);
                y = Math.floor(Math.random()*180);
                sprite.style.left = x + 'px';
                sprite.style.top = y + 'px';
                updateSayBoxPosition();
                i++;
                executeBlock();
                break;
            }
            case 'say': {
                const sayText = block.inputs[0] || 'Hej!';
                const sayTime = block.inputs[1] ? parseFloat(block.inputs[1]) : 2;
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
            }
            case 'wait': {
                const waitTime = block.inputs[0] ? parseFloat(block.inputs[0]) : 1;
                let t2 = setTimeout(() => {
                    i++;
                    executeBlock();
                }, waitTime * 1000);
                currentTimeouts.push(t2);
                break;
            }
            case 'repeat': {
                let repeatBody = [];
                let j = i+1;
                while(j < blocks.length && blocks[j].type !== 'end') {
                    repeatBody.push(blocks[j]);
                    j++;
                }
                const repeatTimes = block.inputs[0] ? parseInt(block.inputs[0]) : 10;
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
                        let tempType = tempBlock.type;
                        switch(tempType) {
                            case 'move': {
                                const moveSteps = tempBlock.inputs[0] ? parseFloat(tempBlock.inputs[0]) : 10;
                                const moveX = tempBlock.inputs[1] ? parseFloat(tempBlock.inputs[1]) : 0;
                                const moveY = tempBlock.inputs[2] ? parseFloat(tempBlock.inputs[2]) : 0;
                                x += moveSteps * Math.cos(direction * Math.PI/180) + moveX;
                                y += moveSteps * Math.sin(direction * Math.PI/180) + moveY;
                                sprite.style.left = x + 'px';
                                sprite.style.top = y + 'px';
                                sprite.style.transform = `rotate(${direction}deg)`;
                                updateSayBoxPosition();
                                k++;
                                runBody();
                                break;
                            }
                            case 'turnR': {
                                const turnRValue = tempBlock.inputs[0] ? parseFloat(tempBlock.inputs[0]) : 15;
                                direction += turnRValue;
                                sprite.dataset.direction = direction;
                                sprite.style.transform = `rotate(${direction}deg)`;
                                updateSayBoxPosition();
                                k++;
                                runBody();
                                break;
                            }
                            case 'turnL': {
                                const turnLValue = tempBlock.inputs[0] ? parseFloat(tempBlock.inputs[0]) : 15;
                                direction -= turnLValue;
                                sprite.dataset.direction = direction;
                                sprite.style.transform = `rotate(${direction}deg)`;
                                updateSayBoxPosition();
                                k++;
                                runBody();
                                break;
                            }
                            case 'goto': {
                                x = Math.floor(Math.random()*240);
                                y = Math.floor(Math.random()*180);
                                sprite.style.left = x + 'px';
                                sprite.style.top = y + 'px';
                                updateSayBoxPosition();
                                k++;
                                runBody();
                                break;
                            }
                            case 'say': {
                                const sayText = tempBlock.inputs[0] || 'Hej!';
                                const sayTime = tempBlock.inputs[1] ? parseFloat(tempBlock.inputs[1]) : 2;
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
                            }
                            case 'wait': {
                                const waitTime = tempBlock.inputs[0] ? parseFloat(tempBlock.inputs[0]) : 1;
                                let t4 = setTimeout(() => {
                                    k++;
                                    runBody();
                                }, waitTime * 1000);
                                currentTimeouts.push(t4);
                                break;
                            }
                            default: {
                                k++;
                                runBody();
                            }
                        }
                    }
                    runBody();
                }
                repeatLoop(0);
                break;
            }
            case 'if': {
                const ifExpr = block.inputs[0] || '';
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
            }
            case 'end': {
                i++;
                executeBlock();
                break;
            }
            case 'ask': {
                const askText = block.inputs[0] || 'Vad heter du?';
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
                const listName = block.inputs[0] || 'minLista';
                if (!kontpassLists[listName]) kontpassLists[listName] = [];
                updateListPanel();
                i++;
                executeBlock();
                break;
            }
            case 'addtolist': {
                let value = block.inputs[0] || '';
                const listName = block.inputs[1] || 'minLista';
                if (value.trim() === 'svar') value = kontpassAnswer;
                if (!kontpassLists[listName]) kontpassLists[listName] = [];
                kontpassLists[listName].push(value);
                updateListPanel();
                i++;
                executeBlock();
                break;
            }
            default: {
                i++;
                executeBlock();
            }
        }
    }
    executeBlock();
}

document.getElementById('runBtn').onclick = function() {
    if (!window.loadedBlocks) return;
    runBlocks(window.loadedBlocks);
};
document.getElementById('stopBtn').onclick = function() {
    stopBlocks();
};

// Ladda spelet från URL
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
                    window.loadedBlocks = game.blocks;
                }
            } catch {}
        }
    }
})();

window.addEventListener('DOMContentLoaded', function() {
    // Set stage background color from localStorage
    let savedColor = localStorage.getItem('workhud_bgcolor');
    if (savedColor) {
        document.getElementById('stage').style.background = savedColor;
    }
});
