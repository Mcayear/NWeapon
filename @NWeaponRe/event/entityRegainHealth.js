import { EventPriority, PowerNukkitX as pnx } from ':powernukkitx';
import { GetPlayerAttr } from '../improvements/AttrComp.js';
import { EntityRegainHealthEvent } from 'cn.nukkit.event.entity.EntityRegainHealthEvent';

pnx.listenEvent("cn.nukkit.event.entity.EntityRegainHealthEvent", EventPriority.NORMAL, event => {
	if (event.getRegainReason() != EntityRegainHealthEvent.CAUSE_EATING) return;
	const addtion = GetPlayerAttr(event.getEntity(), 0, "生命恢复");
	event.getEntity().heal(addtion);
	/*
    //event.setAmount(event.getAmount() + addtion);
	//logger.info(event.getAmount())
	switch(event.getRegainReason()) {
		case EntityRegainHealthEvent.CAUSE_CUSTOM: {
			logger.info("custom");
			break;
		}
		case EntityRegainHealthEvent.CAUSE_EATING: {
			logger.info("eating");
			break;
		}
		case EntityRegainHealthEvent.CAUSE_MAGIC: {
			logger.info("magic");
			break;
		}
		case EntityRegainHealthEvent.CAUSE_REGEN: {
			logger.info("regen");
			break;
		}
		default :{
			logger.info("unknow");
		}
	}*/
});