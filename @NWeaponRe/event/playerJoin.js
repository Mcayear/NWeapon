import { EventPriority, PowerNukkitX as pnx } from ':powernukkitx';
import { SetPlayerAttr } from '../improvements/AttrComp.js';
//import { File } from '@LLSELib';

const _C = contain('NWeapon_C');
pnx.listenEvent("cn.nukkit.event.player.PlayerJoinEvent", EventPriority.NORMAL, event => {
	let name = event.getPlayer().getName();
	seikoFailedNum[name] = 0;
	SetPlayerAttr(name, "装备武器", {});
	if (_C.MainConfig.defaultAttr) {
		SetPlayerAttr(name, "默认属性", _C.MainConfig.defaultAttr);
	}
    /*
    // 这里的处理，似乎没意义
	let tempAttr = File.readFrom("./plugins/NWeapon/PlayerAttrData/"+name+".json");
	if (tempAttr) {
        let dataMap = contain("NWeapon_PlayerAttr");
		tempAttr = JSON.parse(tempAttr);
		data[name].Effect = tempAttr.Effect;
		dataMap.set(name.toLocaleLowerCase(), data);
	}
    */
});