import { Server } from "cn.nukkit.Server";
import { SetPlayerAttr, GetPlayerAttr } from "../improvements/AttrComp.js";
import { defineData } from "../util/Tool.js";
import getAttributeMain from '../improvements/GetAttributeMain.js';

const server = Server.getInstance();
/** @type {healthapi.PlayerHealth} */
let RSHealthAPI = null;
import("healthapi.PlayerHealth")
    .then(({ PlayerHealth }) => {
        RSHealthAPI = PlayerHealth;// 血量核心插件
    });
/** 
 * 遍历在线玩家，根据他们的属性和效果来调整他们的血量和移速
 * 
 * 核心之一
 */
function loopTask() {
	var PlayerList = server.getOnlinePlayers().values().toArray();
	for (let i = 0; i < PlayerList.length; i++) {
		var player = PlayerList[i];
		if (!player.isAlive()) continue;
		var addHealth = 0;
		SetPlayerAttr(player, "装备武器", getAttributeMain(player));
		const Attr = GetPlayerAttr(player);
		const maxh = (Attr.血量加成 || 20) * (1 + defineData(Attr.生命加成));
		addHealth += defineData(Attr.每秒恢复);
		
		var effect;
		effect = GetPlayerAttr(player, 1).Effect;
		const nowTime =  Number((new Date().getTime()/1000).toFixed(0))+0.5;
		for (n in effect) {
			if (nowTime > effect[n].time) {
				SetPlayerAttr(player, "Effect", {id: n, level: 0, time: 0});
				continue;
			}
		}
		effect = player.getEffect(20);
		if (effect) {// 凋零每秒减 效果等级 x 1%最大生命
			addHealth -= ((effect.getAmplifier() + 1) * Math.ceil(0.01 * maxh));
		}
		effect = null;
		if (addHealth != 0) {
			player.heal(addHealth);
		}
		if (RSHealthAPI) {// 若存在血量核心
			let playerHealth = RSHealthAPI.getPlayerHealth(player);
			playerHealth.setMaxHealth("nweapon", maxh);
			const H = playerHealth.getHealth();
			const MaxH = playerHealth.getMaxHealth();
			if (H && H < MaxH && player.getHealth() === player.getMaxHealth()) {
				const num = Math.floor(40 * H / MaxH);
				player.setHealth(num);
			}
		}
	}
}
setInterval(loopTask, 1000);