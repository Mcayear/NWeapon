import { EventPriority, PowerNukkitX as pnx } from ':powernukkitx';
import { SetPlayerAttr } from '../improvements/AttrComp.js';
import getAttributeMain from '../improvements/GetAttributeMain.js';

pnx.listenEvent("cn.nukkit.event.player.PlayerItemHeldEvent", EventPriority.NORMAL, event => {
    let player = event.getPlayer();
	SetPlayerAttr(player, "装备武器", getAttributeMain(player));
});