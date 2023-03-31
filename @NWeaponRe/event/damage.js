import { EventPriority, PowerNukkitX as pnx } from ':powernukkitx';
import { Sound } from 'cn.nukkit.level.Sound';
import { Effect } from 'cn.nukkit.potion.Effect';
import { FloatTextEntity } from 'cn.vusv.njsutil.FloatTextEntity';
import { GetPlayerAttr } from '../improvements/AttrComp.js';
import * as blockitem from '../util/blockitem.js';
import { _C } from '../util/WeaponConfig.js';
import { Entity as JEntity } from "cn.nukkit.entity.Entity";
import { isPlayer, defineData, getProbabilisticResults, getRandomNum } from "../util/Tool.js";

/** @type {com.smallaswater.littlemonster.entity.LittleNpc} */
let LittleNpcClass = null;
import("com.smallaswater.littlemonster.entity.LittleNpc")
    .then(({ LittleNpc }) => {
        LittleNpcClass = LittleNpc;// 副本插件
    });
/** @type {com.smallaswater.npc.entitys.EntityRsNPC} */
let RsNPCClass = null;
import("com.smallaswater.npc.entitys.EntityRsNPC")
    .then(({ EntityRsNPC }) => {
        RsNPCClass = EntityRsNPC;// NPC插件
    });
/** @type {healthapi.PlayerHealth} */
let RSHealthAPI = null;
import("healthapi.PlayerHealth")
    .then(({ PlayerHealth }) => {
        RSHealthAPI = PlayerHealth;// 获取血量核心插件
    });
const PlayerDeathData = {}, PlayerAttkCool = new Map();
const PlayerAttkCoolTime = 150;//  ms
pnx.listenEvent("cn.nukkit.event.entity.EntityDamageByEntityEvent", EventPriority.LOW, event => {
    const NMonster = false;
    if (event.getEventName() === "cn.nukkit.event.entity.EntityDamageEvent" || event.getEventName() === "cn.nukkit.event.entity.EntityDamageByBlockEvent") return;
    if (event.isCancelled()) {
        return;
    }
    let Wounded = event.getEntity();// 被攻击者
    let Damager = event.getDamager();// 攻击者
    let WoundedName = Wounded.getNameTag() || Wounded.getName();
    let DamagerName = Damager.getNameTag() || Damager.getName();
    if (RsNPCClass && Wounded instanceof RsNPCClass) {// 特判RsNPC
        return;
    }
    let WAttr = {};
    let DAttr = isPlayer(Damager) ? GetPlayerAttr(Damager) : (NMonster ? NMonster.GetMonsterAttr(Damager.getId(), 0, false) : {});
    if (Wounded instanceof LittleNpcClass) {
        // 将Java Map对象转换为JavaScript对象
        let it = Wounded.getConfig().getMonsterAttrMap().entrySet().iterator();
        while (it.hasNext()) {
            let entry = it.next();
            let key = entry.getKey();
            let value = entry.getValue();
            WAttr[key] = value;
            if (typeof(value) === 'number') {
                WAttr[key] = value;
            } else {
                WAttr[key] = getRandomNum(value);
            }
        }
    } else {
        WAttr = isPlayer(Wounded) ? GetPlayerAttr(Wounded) : (NMonster ? NMonster.GetMonsterAttr(Wounded.getId(), 0, false) : {});
    }
    // 实体名字格式化
    if (isPlayer(Wounded)) {
        WoundedName = Wounded.name;
    } else {
        if (WoundedName.indexOf('\n') > -1) {
            WoundedName = WoundedName.split('\n')[0];
        } else if (WoundedName.indexOf(' §r') > -1) {
            WoundedName = WoundedName.split(' §t')[0];
        }
    }
    if (isPlayer(Damager)) {
        DamagerName = Damager.name;
        // 处理玩家攻击冷却
        if ((PlayerAttkCool.get(DamagerName) || 0) > new Date().getTime()) {
            event.setCancelled(true);
            return;
        } else {
            PlayerAttkCool.set(DamagerName, new Date().getTime() + PlayerAttkCoolTime);
        }
    } else {
        if (DamagerName.indexOf('\n') > -1) {
            DamagerName = DamagerName.split('\n')[0];
        }
    }
    // Debuff 处理
    var effect = Damager.getEffect(18);
    if (effect && DAttr.暴击率) {// 虚弱每级减10%暴击率,暴击倍率x50%
        DAttr.暴击率 -= ((effect.getAmplifier() + 1) * 0.1);
        if (DAttr.暴击倍率) DAttr.暴击倍率 *= .5;
    }
    effect = Damager.getEffect(19);
    if (effect && DAttr.吸血率) {// 中毒每级减10%吸血率,吸血倍率x50%
        DAttr.吸血率 -= ((effect.getAmplifier() + 1) * 0.1);
        if (DAttr.吸血倍率) DAttr.吸血倍率 *= .5;
    }
    effect = null;
    // 闪避率处理
    DAttr.命中率 = defineData(DAttr.命中率);
    if (getProbabilisticResults(defineData(WAttr.闪避率) - DAttr.命中率)) {
        if (isPlayer(Wounded)) {
            Wounded.getLevel().addSound(Wounded, Sound.valueOf("GAME_PLAYER_ATTACK_NODAMAGE"));
            Wounded.sendMessage("你闪避了 " + DamagerName + " §r的攻击");
        }
        if (isPlayer(Damager)) {
            Damager.getLevel().addSound(Damager, Sound.valueOf("GAME_PLAYER_ATTACK_NODAMAGE"));
            Damager.sendMessage(WoundedName + " §r闪避了你的攻击");
        }
        return event.setCancelled(true);
    }
    // 寒冰攻击 (减移动速度)
    if (getProbabilisticResults(defineData(DAttr.寒冰攻击))) {
        addEntityEffect(Wounded, 2, 1, 140, 128, 128, 128);
        if (isPlayer(Damager)) {
            Damager.sendMessage(WoundedName + " §c受到了寒冰攻击！");
        }
    }
    // 烈焰攻击 (点燃)
    if (getProbabilisticResults(defineData(DAttr.烈焰攻击))) {
        Wounded.setOnFire(7);
        if (isPlayer(Damager)) {
            Damager.sendMessage(WoundedName + " §c被你点燃了！");
        }
    }
    // 血量处理
    if (RSHealthAPI && isPlayer(Wounded)) {// 若存在血量核心
        let PlayerHealth = RSHealthAPI.getPlayerHealth(Wounded);
        let MaxH = PlayerHealth.getMaxHealth();
        let H = PlayerHealth.getHealth();
        if (H > MaxH) {
            PlayerHealth.setHealth(MaxH);
        }
    } else if (NMonster) {
        let h = Wounded.getHealth();
        let maxh = (WAttr.血量值 + defineData(WAttr.血量加成)) * (1 + defineData(WAttr.生命加成));
        Wounded.setMaxHealth(maxh);
        if (h > maxh) {
            Wounded.setHealth(maxh);
        }
    }

    let FinalDamage = 0;
    // 三大乘区: 攻击力 * 攻击加成 * 暴击伤害
    // Attack * Damage Bonus * Critical Ratio
    let 攻击力 = Number((defineData(DAttr.攻击力) * (1 + defineData(DAttr.攻击加成))).toFixed(2));
    let 破防攻击 = getProbabilisticResults(DAttr.破防率) ? defineData(DAttr.破防攻击) : 0;
    let 破甲攻击 = getProbabilisticResults(DAttr.破甲率) ? defineData(DAttr.破甲攻击) : 0;
    WAttr.护甲强度 = defineData(WAttr.护甲强度) - 破甲攻击;// TODO: 未实验

    攻击力 = 攻击力 * (1 - defineData(WAttr.护甲强度));

    let 暴击倍率 = 0, 暴击伤害 = 0;
    if (getProbabilisticResults(DAttr.暴击率 - defineData(WAttr.暴击闪避))) {
        暴击伤害 = defineData(DAttr.爆伤力);
        暴击倍率 = defineData(DAttr.暴击倍率) - defineData(WAttr.暴击抵抗);
        if (暴击倍率 > 0) {
            暴击伤害 += Number((defineData(DAttr.攻击力) * 暴击倍率).toFixed(2));
        }
    }

    let 吸血 = 0, 吸血倍率 = 0;
    if (getProbabilisticResults(DAttr.吸血率)) {
        吸血倍率 = defineData(DAttr.吸血倍率) - defineData(WAttr.吸血抵抗);
        if (吸血倍率 > 0) {
            吸血 = Number((defineData(DAttr.吸血力) + 攻击力 * 吸血倍率).toFixed(2));
        }
    }

    攻击力 = Number((攻击力 + 暴击伤害 * (1 - defineData(WAttr.护甲强度))).toFixed(2));// 护甲强度抵挡暴击伤害

    let 治疗力 = defineData(DAttr.治疗力);

    if (破防攻击 <= 攻击力) {// 从攻击中扣除破防攻击的值，在计算防御力后添加至伤害
        攻击力 -= 破防攻击;
    } else {// 如果破防攻击大于攻击力，则将所有攻击力转为破防攻击
        破防攻击 = 攻击力;
        攻击力 = 1;
    }
    if (攻击力) {
        //[(武器攻击+其他伤害来源)*(1+攻击加成) - 防御力*(1+防御加成)]*(100%-护甲强度)+{破防攻击-[防御力*(1+防御加成)]}
        //let 伤害 = 攻击力 - (defineData(WAttr.防御力) * (1 + defineData(WAttr.防御加成)) * defineData(WAttr.护甲强度));
        let 伤害 = 攻击力 - (defineData(WAttr.防御力) * (1 + defineData(WAttr.防御加成)));
        if (伤害 < 1) {
            伤害 = 0;
        }
        伤害 += 破防攻击;

        // 跳砍判断
        if (_C.MainConfig.jumpSplit && _C.MainConfig.jumpSplit.enable) {
            if (!Damager.onGround) {// isPlayer(Damager)
                const addDamage = Number((伤害 * 0.1).toFixed(1));// 跳砍增加0.1倍最终伤害，最大不超过3k
                伤害 += addDamage > 3e3 ? 3e3 : addDamage;
            }
        }

        FinalDamage = 伤害;
    }
    if (getProbabilisticResults(WAttr.反伤率)) {
        let 反伤 = defineData(WAttr.反伤倍率 * FinalDamage) + defineData(WAttr.反伤力);
        let WHealth = Wounded.getHealth();
        if (isPlayer(WHealth)) {
            let PlayerHealth = RSHealthAPI.getPlayerHealth(Wounded);
            if (RSHealthAPI) {// 血量核心
                WHealth = PlayerHealth.getHealth();
            }
        }
        // 反伤不超过受害者现有血量
        if (WHealth < 反伤) 反伤 = WHealth;
        if (isPlayer(Damager)) {
            let PlayerHealth = RSHealthAPI.getPlayerHealth(Damager);
            if (RSHealthAPI) {// 血量核心
                let H = PlayerHealth.getHealth() - 反伤;
                PlayerHealth.setHealth(H < 1 ? 0 : H);
            } else {
                let h = Damager.getHealth() - 反伤;
                Damager.setHealth(h < 1 ? 0 : h);
            }
            Damager.getLevel().addSound(Damager, Sound.valueOf("ARMOR_EQUIP_CHAIN"));
        }
    }
    if (治疗力 && isPlayer(Wounded)) {
        if (治疗力 > 0) {
            治疗力 = 0;
        }
        let WoundedHealth = Wounded.getHealth();
        let WoundedMaxHealth = Wounded.getMaxHealth();
        let PlayerHealth = RSHealthAPI.getPlayerHealth(Wounded);
        if (RSHealthAPI) {
            WoundedHealth = PlayerHealth.getHealth();
            WoundedMaxHealth = PlayerHealth.getMaxHealth();
        }
        let health = WoundedHealth - 治疗力;
        if (health > WoundedMaxHealth) {
            PlayerHealth.setHealth(WoundedMaxHealth);
        } else {
            PlayerHealth.setHealth(health);
        }
        FinalDamage = 治疗力;
        event.setDamage(0);
    }
    if (吸血) {
        let WHealth = Wounded.getHealth();
        if (isPlayer(WHealth)) {
            let PlayerHealth = RSHealthAPI.getPlayerHealth(Wounded);
            if (RSHealthAPI) {// 血量核心
                WHealth = PlayerHealth.getHealth();
            }
        }
        // 吸血不超过受害者现有血量
        if (WHealth < 吸血) 吸血 = WHealth;
        if (RSHealthAPI && isPlayer(Damager)) {// 若存在血量核心
            let PlayerHealth = RSHealthAPI.getPlayerHealth(Damager);
            const MaxH = PlayerHealth.getMaxHealth();
            const H = PlayerHealth.getHealth() + 吸血;
            PlayerHealth.setHealth(H > MaxH ? MaxH : H);
        } else {
            Damager.heal(吸血);
        }
        if (isPlayer(Damager)) {
            Damager.sendMessage("你已汲取对方 §c§l" + 吸血 + "§r 血量值");
        }
    }
    if (暴击伤害 > 0 && isPlayer(Damager)) {
        Damager.sendMessage("你对" + WoundedName + "§r造成了 §l" + 暴击伤害 + "§r 点暴击伤害");
    }
    FinalDamage = (FinalDamage || event.getFinalDamage()).toFixed(2);
    if (FinalDamage < 1 && FinalDamage > -1) {// 区间(1, -1) 设置为0
        FinalDamage = 0;
    }
    if (!治疗力 && FinalDamage < 0) {// 没有治疗力但是 伤害为负 设置为0
        FinalDamage = 0;
    }
    event.setDamage(Math.floor(FinalDamage));
    if (isPlayer(Wounded) && FinalDamage > 0) {
        //updateUnbreaking(Wounded, false);
        PlayerDeathData[Wounded.name] = [DamagerName, isPlayer(Damager) ? blockitem.getItemInHand(Damager).getCustomName() : null];
        //console.log("设置了"+WoundedName+"的死亡提示")
    }
    if (isPlayer(Damager)) {
        //updateUnbreaking(Damager, true);
    }
    if (_C.MainConfig.useHarmFloatWord && isPlayer(Damager)) {
        let FloatText = new FloatTextEntity(Wounded.getLevel().getChunk(Wounded.getChunkX(), Wounded.getChunkZ()), JEntity.getDefaultNBT(Wounded));
        FloatText.setNameTagVisible(true);
        FloatText.setNameTag(FinalDamage < 0 ? "§a+" + (-FinalDamage) : "§c-" + FinalDamage);
        FloatText.setNameTagAlwaysVisible(true);
        FloatText.setScale(0.0001);
        Wounded.getLevel().addEntity(FloatText);
        FloatText.spawnToAll();
        FloatText.lookAt(Damager);
        FloatText.knockBack(Damager, 0, FloatText.x - Damager.x, FloatText.z - Damager.z, 0.3);
    }
});

/**
 * 为生物添加药水状态
 * @param {JEntity} entity 生物对象
 * @param {number} id 药水id
 * @param {number} level 药效等级
 * @param {number} tick 持续时间(刻)
 * @param {number} r 药效粒子颜色 r
 * @param {number} g 药效粒子颜色 g
 * @param {number} b 药效粒子颜色 b
 */
function addEntityEffect(entity, id, level, tick, r, g, b) {
    const effect = Effect.getEffect(id).setAmplifier(level).setVisible(true).setDuration(tick);
    effect.setColor(r, g, b);
    entity.addEffect(effect);
}
function close() {
    for (const i of Server.getInstance().getLevels().values()) { // Clear all the JS entities.
        /** @type {cn.nukkit.level.Level} */
        const level = i;
        level.getEntities().forEach(e => {
            if (e instanceof FloatTextEntity) {
                e.close();
            }
        })
    }
}
exposeObject('NWeapon_damageClose', close);// 监听伤害事件
