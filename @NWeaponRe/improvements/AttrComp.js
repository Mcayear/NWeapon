import { Player as JPlayer } from 'cn.nukkit.Player';
import { getRandomNum, isPlayer } from '../util/Tool.js';

// 为玩家属性申请共享内存
if (!contain("NWeapon_PlayerAttr")) exposeObject("NWeapon_PlayerAttr", new Map());
// 为怪物属性申请共享内存
//if (!!contain("NWeapon_MonsterAttr")) exposeObject("NWeapon_MonsterAttr", new Map());

/**
 * 获取玩家属性
 * @param {JPlayer} player - 玩家对象
 * @param {number} mode - 数据模式，可以是 0'Main' 或 1'原始数据'
 * @param {string} key - 属性名称，如'攻击力'或'防御力'
 * @return {object|number} 返回玩家属性的对象，如果有key则是玩家指定属性的数值
 */
export function GetPlayerAttr(player, mode, key) {
    const _C = contain('NWeapon_C');
    /** 玩家名字 */
    let name = "";
	if (isPlayer(player)) {
		if (_C.MainConfig["worlds-disabled"].indexOf(player.getLevel().getName()) > -1) {
			return {};
		}
		name = player.getName().toLocaleLowerCase();
	} else if (typeof(player) != "string") {
		return {};
	} else {
        name = player.toLocaleLowerCase();
    }
    /** @type {Map<string, {}>} */
	let dataMap = contain("NWeapon_PlayerAttr");
	if (!dataMap.has(name)) {
		return {};
	}
	let data = JSON.parse(JSON.stringify(dataMap.get(name)));// 深拷贝，避免影响原数据
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
 * @param {string} item 设置的属性项目例如，装备武器
 * @param {*} newAttr 
 * @returns 
 */
export function SetPlayerAttr(player, item, newAttr) {
    /** 玩家名字 */
    let name = "";
	if (isPlayer(player)) {
		name = player.getName().toLocaleLowerCase();
	} else if(typeof(item) != "string") {
		return false;
    } else {
        name = player.toLocaleLowerCase();
    }
	if (typeof(newAttr) === "string") newAttr = JSON.parse(newAttr);
    /** @type {Map<string, {}>} */
	let dataMap = contain("NWeapon_PlayerAttr");
	if (!dataMap.has(name)) {
		dataMap.set(name, {Effect: {}, EffectSuit: [], Main: {}});
	}
	let data = JSON.parse(JSON.stringify(dataMap.get(name)));// 深拷贝，避免影响原数据
	switch (item) {
		case "Effect": {//newAttr: {id: 1, level: 1, time: s};
			if (newAttr.id === false) {
				data["Effect"] = {};
				return true;
			}
			let effectdata = data["Effect"][newAttr.id];
			if (!effectdata) {
				effectdata = {level: 0, time: 0};
			}
			if (newAttr.level && newAttr.level > effectdata.level) {
				effectdata.level = newAttr.level;
			}
			if (newAttr.time) {
				effectdata.time = Number((new Date().getTime()/1000).toFixed(0)) + Number(newAttr.time);
				data.Effect[newAttr.id] = effectdata;
			} else {
				delete data.Effect[newAttr.id];
			}
            dataMap.set(name, data);
			return true;
		}
		case "EffectSuit": {// newAttr: ["suit1", "suit2"]
			data["EffectSuit"] = newAttr;
            dataMap.set(name, data);
			return data["EffectSuit"];
		}
		case "Main": {
			logger.warning("setPlayerAttr(): '"+item+"' is the wrong item parameter.");
			return false;
		}
	}
	if (newAttr['delete']) {
		delete data[item];
		return true;
	}
	if (!data[item]) data[item] = {};
	let oldAttr = data[item];
	for (var i in newAttr) {
		if (typeof(newAttr[i]) === 'string' || typeof(newAttr[i]) === 'number') {
			newAttr[i] = [Number(newAttr[i]), Number(newAttr[i])];
		}
		if (typeof(newAttr[i]) === 'object') {
			if (!data.Main[i]) data.Main[i] = [0, 0];
			for(let k = 0; k<newAttr[i].length; k++) {
				data.Main[i][k] = data.Main[i][k] - (oldAttr[i] ? oldAttr[i][k] : 0) + newAttr[i][k];
			}
			continue;
		}
	}
	for (var i in oldAttr) {// 处理oldAttr有但是newAttr没有的属性
		if (!newAttr[i]) if (typeof(oldAttr[i]) === 'object') {
			if (!data.Main[i]) data.Main[i] = [0, 0];
			for(let k = 0; k<oldAttr[i].length; k++) {
				data.Main[i][k] = data.Main[i][k] - oldAttr[i][k];
			}
		} else {
			data.Main[i] = data.Main[i] - oldAttr[i];
		}
	}
	data[item] = newAttr;
    dataMap.set(name, data);
	if (JSON.stringify(newAttr).length === 2) {
		delete data[item];
	}
	return true;
}