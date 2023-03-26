import { Player as JPlayer } from 'cn.nukkit.Player';

// 为玩家属性申请共享内存
if (!contain("NWeapon_PlayerAttr")) exposeObject("NWeapon_PlayerAttr", {});
// 为怪物属性申请共享内存
//if (!!contain("NWeapon_MonsterAttr")) exposeObject("NWeapon_MonsterAttr", {});

/**
 * 获取玩家属性
 * @param {JPlayer} player - 玩家对象
 * @param {number} mode - 数据模式，可以是 0'Main' 或 1'原始数据'
 * @param {string} key - 属性名称，如'攻击力'或'防御力'
 * @return {object|number} 返回玩家属性的对象，如果有key则是玩家指定属性的数值
 */
export function GetPlayerAttr(player, mode, key) {
    const _C = contain('NWeapon_C');
	if (isPlayer(player)) {
		if (_C.MainConfig["worlds-disabled"].indexOf(player.getLevel().getName()) > -1) {
			return {};
		}
		player = player.getName();
	} else if (typeof(player) != "string") {
		return {};
	}
	let data = contain("NWeapon_PlayerAttr")[player];
	if (!data) {
		return {};
	}
	data = JSON.parse(JSON.stringify(data));
	if (mode) {
		for (var i in data.Effect) {
			if (!data.Main[i]) {
				data.Main[i] = [Number(data.Effect[i].level)];
				continue;
			}
			if(data.Main[i].length == 2) {
				data.Main[i][0] += Number(data.Effect[i].level);
				data.Main[i][1] += Number(data.Effect[i].level);
			} else if(data.Main[i].length == 1) {
				data.Main[i][0] += Number(data.Effect[i].level);
			}
		}
		return data;
	}
	if (key) {
		let back = data.Effect[key] ? data.Effect[key].level : 0;
		if (!data.Main[key] && back === 0) {
			return 0;
		}
		if (typeof(data.Main[key]) === "object") {
			back += getRandomNum(data.Main[key]);
			return back;
		}
		return data.Main[key] + back;
	}
	for (var i in data.Main) {
		if (data.Main[i][0] === data.Main[i][1]) {
			data.Main[i] = data.Main[i][0];
		} else {
			data.Main[i] = getRandomNum(data.Main[i]);
		}
	}
	for (var i in data.Effect) {
		if (data.Main[i]) {
			data.Main[i] += Number(data.Effect[i].level);
		} else {
			data.Main[i] = Number(data.Effect[i].level);
		}
	}
	return data.Main;
}
/**
 * 设置玩家属性
 * @param {JPlayer} player 
 * @param {*} item 
 * @param {*} newAttr 
 * @returns 
 */
export function SetPlayerAttr(player, item, newAttr) {
	if (isPlayer(player)) {
		player = player.getName();
	} else if(typeof(item) != "string") {
		return false;
	}
	if (typeof(newAttr) === "string") newAttr = JSON.parse(newAttr);
	let data = contain("NWeapon_PlayerAttr");
	if (!data[player]) {
		data[player] = {Effect: {}, EffectSuit: [], Main: {}};
	}
	switch (item) {
		case "Effect": {//newAttr: {id: 1, level: 1, time: s};
			if (newAttr.id === false) {
				data[player].Effect = {};
				//database.memoryStorage.setItem("PlayerAttr", data);
				return true;
			}
			let effectdata = data[player].Effect[newAttr.id];
			if (!effectdata) {
				effectdata = {level: 0, time: 0};
			}
			if (newAttr.level && newAttr.level > effectdata.level) {
				effectdata.level = newAttr.level;
			}
			if (newAttr.time) {
				effectdata.time = Number((new Date().getTime()/1000).toFixed(0)) + Number(newAttr.time);
				data[player].Effect[newAttr.id] = effectdata;
			} else {
				delete data[player].Effect[newAttr.id];
			}
			//database.memoryStorage.setItem("PlayerAttr", data);
			return true;
		}
		case "EffectSuit": {//newAttr: ["suit1", "suit2"]
			data[player]["EffectSuit"] = newAttr;
			//database.memoryStorage.setItem("PlayerAttr", data);
			return data[player]["EffectSuit"];
		}
		case "Main": {
			logger.warning("setPlayerAttr(): '"+item+"' is the wrong item parameter.");
			return false;
		}
	}
	if (newAttr['delete']) {
		delete data[player][item];
		return true;
	}
	if (!data[player][item]) data[player][item] = {};
	let oldAttr = data[player][item];
	for (var i in newAttr) {
		if (typeof(newAttr[i]) === 'string' || typeof(newAttr[i]) === 'number') {
			newAttr[i] = [Number(newAttr[i]), Number(newAttr[i])];
		}
		if (typeof(newAttr[i]) === 'object') {
			if (!data[player].Main[i]) data[player].Main[i] = [0, 0];
			for(let k = 0; k<newAttr[i].length; k++) {
				data[player].Main[i][k] = data[player].Main[i][k] - (oldAttr[i] ? oldAttr[i][k] : 0) + newAttr[i][k];
			}
			continue;
		}
	}
	for (var i in oldAttr) {// 处理oldAttr有但是newAttr没有的属性
		if (!newAttr[i]) if (typeof(oldAttr[i]) === 'object') {
			if (!data[player].Main[i]) data[player].Main[i] = [0, 0];
			for(let k = 0; k<oldAttr[i].length; k++) {
				data[player].Main[i][k] = data[player].Main[i][k] - oldAttr[i][k];
			}
		} else {
			data[player].Main[i] = data[player].Main[i] - oldAttr[i];
		}
	}
	data[player][item] = newAttr;
	//database.memoryStorage.setItem("PlayerAttr", data);
	if (JSON.stringify(newAttr).length === 2) {
		delete data[player][item];
	}
	return true;
}

/**
 * 判断是不是玩家
 * @param {*} entity 
 * @returns {boolean}
 */
function isPlayer(entity) {
	return entity instanceof JPlayer;
}
/**
 * 获取一个数组范围内的随机数
 * @param {[number,number]} array - 一个包含两个数字的数组，表示最小值和最大值
 * @return {number} - 返回一个在最小值和最大值之间的随机数，保留两位小数
 */
function getRandomNum(array){
	let length = 0;
	if (array.length === 1 && array[0] === array[1]) {
		return array[0];
	}
	array.forEach(function (v){
		let last = (v + []).split(".")[1];
		if (last && length < last.length) {
			length = last.length;
		}
	});
	length = Math.pow(10, length + 2);
	let minNum = array[0] * length;
	let maxNum = array[1] * length;
	return parseInt(Math.random() * (maxNum - minNum + 1) + minNum,10) / length;
    
}