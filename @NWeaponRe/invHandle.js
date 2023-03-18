export const FakeInvEvent = {
    StrengthFakeInvChange,
    StrengthFakeInvClose,
    SeikoFakeInvChange,
    SeikoFakeInvClose,
    ForgingFakeInvChange,
    ForgingFakeInvClose
}
// 强化 - 虚拟物品栏物品更改事件处理
export function StrengthFakeInvChange (event, slot) {
    var slot = event.getAction().getSlot();
    if (slot != 0) {
        return event.setCancelled(true);
    }
}
// 强化 - 虚拟物品栏关闭事件处理
export function StrengthFakeInvClose (event) {
    var player = event.getPlayer();
    var inv = event.getAction().getInventory();
    let HandItem = inventory.getInventorySlot(inv, 0);
    if (HandItem.getId() === 0) {
        return;
    }
    let backItem = function (msg) {
        if (msg) {
            player.sendMessage("[NWeapon] " + msg);
        }
        blockitem.addItemToPlayer(player, HandItem);
    }
    if (!HandItem.getCustomName() || !HandItem.getNamedTag().getString('NWeaponNameTag')) {
        return backItem("§c非NWeapon物品");
    }
    var nTag = HandItem.getNamedTag().getString('NWeaponNameTag').split(";");
    var index = ["Weapon", "Armor"].indexOf(nTag[0]);
    let HandItemData, HandItemName = HandItem.getCustomName() || HandItem.getName();
    if (index === -1) {
        return backItem("§c请在第一格放入NWeapon装备");
    } else if (index === 0) {
        HandItemData = WeaponConfig[nTag[1]];
    } else if (index === 1) {
        HandItemData = ArmorConfig[nTag[1]];
    }
    if (!HandItemData) {
        return backItem(HandItemName + " §r§c的配置文件丢失");
    }
    if (HandItemData.不可强化) {
        return backItem("§c装备 " + HandItemName + " §r§c不可强化");
    }
    let nbtObj = HandItem.getNamedTag().getString('Strengthen');
    if (!nbtObj) {
        nbtObj = { level: 0 };
        HandItem.setNamedTag(HandItem.getNamedTag().putString('Strengthen', JSON.stringify(nbtObj)));
    } else {
        nbtObj = JSON.parse(nbtObj);
    }

    switch (Config.Strengthen.model) {
        case 2:
            {
                var hasEntry = HandItem.getNamedTag().getByte('entry');
                if (!hasEntry) {
                    return backItem("§c装备 " + HandItemName + " §r§c没有可以强化的词条");
                }

                let forgingAttr = HandItem.getNamedTag().getString('forging');
                if (!forgingAttr.length) {
                    return backItem("§c装备 " + HandItemName + " §r§c的词条已损坏");
                }
                if (nbtObj.level >= Config.Strengthen.need.length) {
                    return backItem("§c装备 " + HandItemName + "  §r§c已是最大强化等级");
                }
                if (!examineNeed(Config.Strengthen.need[nbtObj.level].split("||"), player.getInventory(), false, player)[0]) {
                    return blockitem.addItemToPlayer(player, HandItem);
                }
                let res = entryConfigToUpdate(HandItem.clone(), HandItemData, JSON.parse(forgingAttr), player);
                if (!res) {
                    return backItem("§c装备 " + HandItemName + "  §r§c已是最大强化等级。");
                }
                blockitem.addItemToPlayer(player, res);
            }
            break;
        default:
            {
                if (!examineNeed(Config.Strengthen.need[nbtObj.level].split("||"), player.getInventory(), false, player)[0]) {
                    return backItem();
                }
                let oldLore = blockitem.getItemLore(HandItem),
                    probability = Config.Strengthen.chance[nbtObj.level] + defineData(strengthFailedNum[player.name]) * Config.Strengthen.failedAddition,
                    failProtect = 0,
                    straightUp = 0,
                    luck = false;
                let bagitems = inventory.getPlayerInv(player);
                for (var i = 0; i < 9; i++) {
                    let item = inventory.getInventorySlot(bagitems, i);
                    if (item.getCustomName() && item.getNamedTag().getString('NWeaponNameTag')) {
                        let arr = item.getNamedTag().getString('NWeaponNameTag').split(";");
                        if (arr[0] === ItemTypeList["强化石"]) {
                            let count = 1;
                            luck_ = item.getNamedTag().getString('Luck') || 0;
                            failProtect_ = item.getNamedTag().getString('FailProtect') || 0;
                            straightUp_ = item.getNamedTag().getString('StraightUp') || 0;
                            if (straightUp && straightUp_) {
                                continue;
                            }
                            if (straightUp_ > 0) {
                                if (straightUp_ > nbtObj.level) {
                                    probability = 1;
                                    straightUp = straightUp_;
                                } else {// 不符合消耗条件，跳过直升石
                                    continue;
                                }
                            }
                            if (luck && luck_) {
                                continue;
                            }
                            if (!isNaN(luck_) && luck_ > 0) {
                                if (item.getNamedTag().getString('stacking')) {
                                    count = Math.ceil(1 / luck_);
                                    if (item.getCount() < count) {
                                        count = item.getCount();
                                    }
                                }
                                probability += Number(luck_) * count;
                                luck = true;
                            }
                            if (failProtect && failProtect_) {
                                continue;
                            }
                            failProtect = !isNaN(failProtect_) ? Number(failProtect_) : 0;
                            item.setCount(count);
                            blockitem.removeItemToPlayer(player, item);
                            player.sendMessage("[NWeapon] §7你消耗了 " + item.getCustomName() + "§r§7 *" + count);
                        }
                    }
                }
                if (getProbabilisticResults(probability)) {
                    if (straightUp) {
                        nbtObj.level = straightUp;
                    } else {
                        nbtObj.level++;
                    }
                    if (oldLore.indexOf("§r§7§l======【 §c强化§7 】======;§r§fLv§e.") > -1) {
                        oldLore = oldLore.replace(/§r§7§l======【 §c强化§7 】======;§r§fLv§e\. .+ §r/, "§r§7§l======【 §c强化§7 】======;§r§fLv§e. " + getGradeSymbol.strengthen(nbtObj.level) + " §r");
                    } else {
                        oldLore += "§r§7§l======【 §c强化§7 】======;§r§fLv§e. " + getGradeSymbol.strengthen(nbtObj.level) + " §r";
                    }
                    if (Config.Strengthen.broadcastMessage && nbtObj.level >= Config.Strengthen.broadcastMessage[0]) {
                        server.broadcastMessage(Config.Strengthen.broadcastMessage[1].replace("%p", player.name).replace("%lv", nbtObj.level).replace("%weapon", HandItemName));
                    } else {
                        logger.info(player.name + "淬炼 " + HandItemName + " §r至 " + nbtObj.level + " 级");
                    }
                    strengthFailedNum[player.name] = 0;
                    player.sendTitle("§a§l+ 淬炼成功 +", "§e" + nbtObj.level + "级 §6" + getGradeSymbol.strengthen(nbtObj.level));
                    blockitem.setItemLore(HandItem, oldLore);
                    HandItem.setNamedTag(HandItem.getNamedTag().putString('Strengthen', JSON.stringify(nbtObj)));
                    blockitem.addItemToPlayer(player, HandItem);
                } else {
                    let num = 0;
                    for (i = 0; i < Config.Strengthen.failed.length; i++) {
                        if (nbtObj.level <= Config.Strengthen.failed[i][0]) {
                            num = getArrayProbabilisticResults(Config.Strengthen.failed[i], 1);
                            break;
                        }
                    }
                    if (getProbabilisticResults(failProtect) || num === -1) {
                        player.sendTitle("§c§l- 淬炼失败 -", "§6本次受到保护");
                        blockitem.addItemToPlayer(player, HandItem);
                    } else {
                        if (num === 0) {
                            player.sendTitle("§c§l- 淬炼失败 -", "§l§4武器在淬炼中损坏");[]
                        } else {
                            let res = nbtObj.level - num;
                            if (res < 1) {
                                res = 1;
                            }
                            player.sendTitle("§c§l- 淬炼失败 -", "§4下降" + (nbtObj.level - res) + "级 §6" + getGradeSymbol.strengthen(res));
                            seikoFailedNum[player.name]++;
                            nbtObj.level = res;
                            oldLore = oldLore.replace(/§r§7§l======【 §c强化§7 】======;§r§fLv§e\. .+ §r/, "§r§7§l======【 §c强化§7 】======;§r§fLv§e. " + getGradeSymbol.strengthen(res) + " §r");
                            blockitem.setItemLore(HandItem, oldLore);
                            HandItem.setNamedTag(HandItem.getNamedTag().putString('Strengthen', JSON.stringify(nbtObj)));
                            blockitem.addItemToPlayer(player, HandItem);
                        }
                    }
                }
            }
    }
}
// 精工 - 虚拟物品栏物品更改事件处理
export function SeikoFakeInvChange (event, slot) {
    var slot = event.getAction().getSlot();
    if (slot != 0) {
        return event.setCancelled(true);
    }
}
// 精工 - 虚拟物品栏关闭事件处理
export function SeikoFakeInvClose (event, player, inv) {
    var player = event.getPlayer();
    var inv = event.getAction().getInventory();

    let item = inventory.getInventorySlot(inv, 0);
    if (item.getId() === 0) {
        return;
    }
    let backItem = function (msg) {
        if (msg) {
            player.sendMessage("[NWeapon] " + msg);
        }
        blockitem.addItemToPlayer(player, item);
    }
    if (!item.getCustomName() || !item.getNamedTag().getString('NWeaponNameTag')) {
        return backItem("§c非NWeapon物品");
    }
    var nTag = item.getNamedTag().getString('NWeaponNameTag').split(";");
    var index = ["Weapon", "Armor"].indexOf(nTag[0]);
    let HandItemData, HandItemName = item.getCustomName() || item.getName();
    if (index === -1) {
        return backItem("§c请在第一格放入NWeapon装备");
    } else if (index === 0) {
        HandItemData = WeaponConfig[nTag[1]];
    } else if (index === 1) {
        HandItemData = ArmorConfig[nTag[1]];
    }
    if (!HandItemData) {
        return backItem(HandItemName + " §r§c的配置文件丢失");
    }
    if (HandItemData.不可精工) {
        return backItem("§c装备 " + HandItemName + " §r§c不可精工");
    }
    let nbtObj = item.getNamedTag().getString('Seiko');
    if (nbtObj === '') {
        nbtObj = { level: 0 };
        item.setNamedTag(item.getNamedTag().putString('Seiko', JSON.stringify(nbtObj)));
    } else {
        nbtObj = JSON.parse(nbtObj);
    }
    if (manager.getMoney(player) < Config.Seiko.needMoney[nbtObj.level]) {
        return backItem("§c金币不足，您至少需要 " + Config.Seiko.needMoney[nbtObj.level] + " 金钱");
    }
    manager.reduceMoney(player, Config.Seiko.needMoney[nbtObj.level]);
    let oldLore = blockitem.getItemLore(item), probability = Config.Seiko.chance[nbtObj.level] + defineData(seikoFailedNum[player.name]) * Config.Seiko.failedAddition;
    let failProtect = straightUp = 0, luck = false;
    let bagitems = inventory.getPlayerInv(player);
    for (var i = 0; i < 9; i++) {
        let seiko_item = inventory.getInventorySlot(bagitems, i);
        if (seiko_item.getCustomName() && seiko_item.getNamedTag().getString('NWeaponNameTag')) {
            let arr = seiko_item.getNamedTag().getString('NWeaponNameTag').split(";");
            if (arr[0] === ItemTypeList["精工石"]) {
                let count = 1;
                luck_ = seiko_item.getNamedTag().getString('Luck') || 0;
                failProtect_ = seiko_item.getNamedTag().getString('FailProtect') || 0;
                straightUp_ = seiko_item.getNamedTag().getString('StraightUp') || 0;
                if (straightUp && straightUp_) {
                    continue;
                }
                if (straightUp_ > 0) {
                    if (straightUp_ > nbtObj.level) {
                        probability = 1;
                        straightUp = straightUp_;
                    } else {// 不符合消耗条件，跳过直升石
                        continue;
                    }
                }
                if (luck && luck_) {
                    continue;
                }
                if (!isNaN(luck_) && luck_ > 0) {
                    if (seiko_item.getNamedTag().getString('stacking')) {
                        count = Math.ceil(1 / luck_);
                        if (seiko_item.getCount() < count) {
                            count = seiko_item.getCount();
                        }
                    }
                    probability += Number(luck_) * count;
                    luck = true;
                }
                if (failProtect && failProtect_) {
                    continue;
                }
                failProtect = !isNaN(failProtect_) ? Number(failProtect_) : 0;
                seiko_item.setCount(count);
                blockitem.removeItemToPlayer(player, seiko_item);
                player.sendMessage("[NWeapon] §7你消耗了 " + seiko_item.getCustomName() + "§r§7 *" + count);
            }
        }
    }

    if (getProbabilisticResults(probability)) {
        if (straightUp) {
            nbtObj.level = straightUp;
        } else {
            nbtObj.level++;
        }
        if (oldLore.indexOf("§r§6§l精工等级:§e ") > -1) {
            oldLore = oldLore.replace(/§r§6§l精工等级:§e .+ §r/, "§r§6§l精工等级:§e " + getGradeSymbol.seiko(nbtObj.level) + " §r");
        } else {
            oldLore += "§r§6§l精工等级:§e " + getGradeSymbol.seiko(nbtObj.level) + " §r";
        }
        if (Config.Seiko.broadcastMessage && nbtObj.level >= Config.Seiko.broadcastMessage[0]) {
            server.broadcastMessage(Config.Seiko.broadcastMessage[1].replace("%p", player.name).replace("%lv", nbtObj.level).replace("%weapon", HandItemName));
        } else {
            logger.info(player.name + "精工 " + HandItemName + " §r至 " + nbtObj.level + " 级");
        }
        seikoFailedNum[player.name] = 0;
        player.sendTitle("§a§l+ 精工成功 +", "§e" + nbtObj.level + "级 §6" + getGradeSymbol.seiko(nbtObj.level));
        blockitem.setItemLore(item, oldLore);
        item.setNamedTag(item.getNamedTag().putString('Seiko', JSON.stringify(nbtObj)));
        blockitem.addItemToPlayer(player, item);
    } else {
        let num = 0;
        for (i = 0; i < Config.Seiko.failed.length; i++) {
            if (nbtObj.level <= Config.Seiko.failed[i][0]) {
                num = getArrayProbabilisticResults(Config.Seiko.failed[i], 1);
                break;
            }
        }
        if (getProbabilisticResults(failProtect) || num === -1) {
            backItem("§c§l- 精工失败 -", "§6本次受到保护");
            blockitem.addItemToPlayer(player, item);
        } else {
            let res = nbtObj.level - (num + 1);
            if (res < 1) {
                res = 1;
            }
            player.sendTitle("§c§l- 精工失败 -", "§4下降" + (nbtObj.level - res) + "级 §6" + getGradeSymbol.seiko(res));
            seikoFailedNum[player.name]++;
            nbtObj.level = res;
            oldLore = oldLore.replace(/§r§6§l精工等级:§e .+ §r/, "§r§6§l精工等级:§e " + getGradeSymbol.seiko(res) + " §r");
            blockitem.setItemLore(item, oldLore);
            item.setNamedTag(item.getNamedTag().putString('Seiko', JSON.stringify(nbtObj)));
            blockitem.addItemToPlayer(player, item);
        }
    }
}
// 锻造 - 虚拟物品栏物品更改事件处理
export function ForgingFakeInvChange (event) {
    var player = event.getPlayer();
    var slot = event.getAction().getSlot();
    var inv = event.getAction().getInventory();
    var newItem = event.getAction().getTargetItem();

    if (!PlayerSmithingTempData[player.name]) {
        PlayerSmithingTempData[player.name] = null;
    }
    if (slot == 0) {
        let paperData = PaperConfig[newItem.getCustomName()];
        if (paperData) {
            if (!PlayerData[player.getName()]) PlayerData[player.getName()] = { exp: 0, level: 0 };
            if (paperData.限制等级 > PlayerData[player.getName()].level) {
                player.sendMessage("[NWeapon] §c您的锻造师等级不足");
            } else {
                let nameTag = newItem.getNamedTag().getString('NWeaponNameTag');
                if (nameTag && nameTag.slice(0, nameTag.indexOf(";")) === ItemTypeList["图纸"]) {
                    PlayerSmithingTempData[player.name] = JSON.parse(JSON.stringify(paperData));//消除对象关联性，这非常重要！！！
                    if (PlayerSmithingTempData[player.name]) return;
                    player.sendMessage("[NWeapon] §c配置文件中没有这个锻造方案");
                } else {
                    player.sendMessage("[NWeapon] §c这不是有效的锻造图纸");
                    event.setCancelled(true);
                }
            }
        } else {
            player.sendMessage("[NWeapon] §c锻造图纸不存在");
        }
        event.setCancelled(true);
    } else {
        if (!PlayerSmithingTempData[player.name]) {
            player.sendMessage("[NWeapon] §c请先在第一格放入图纸");
            event.setCancelled(true);
            return;
        }
        if (Config.锻造模式 == 0) {
            if (slot == 1) {
                let TempData = PlayerSmithingTempData[player.name].方案[1];
                let data = WeaponConfig[data[0]] || ArmorConfig[data[0]];
                if (data === undefined) {
                    player.sendMessage("[NWeapon] §c这不是一个NWeapon装备");
                    event.setCancelled(true);
                    return;
                }
                if (newItem.getCustomName() === TempData[0] && newItem.getId() === TempData[1] && newItem.getDamage() === TempData[2]) {
                    if (TempData[3]) {
                        if (blockitem.getNBTString(newItem) != blockitem.getNBTString(getItem(TempData[0], data))) {
                            player.sendMessage("[NWeapon] §c你不能为这个NWeapon装备进行锻造");
                            event.setCancelled(true);
                            return;
                        }
                    }
                } else {
                    player.sendMessage("[NWeapon] §c这不是图纸需求的装备");
                    event.setCancelled(true);
                    return;
                }
            } else {
                if (inventory.getInventorySlot(inv, 1).getId() == 0) {
                    player.sendMessage("[NWeapon] §c请先在第2格放入装备");
                    event.setCancelled(true);
                    return;
                }
                if (inventory.getInventorySlot(inv, slot - 1).getId() == 0) {
                    player.sendMessage("[NWeapon] §c请先在第" + (slot - 1) + "格放入材料");
                    event.setCancelled(true);
                    return;
                }
            }
        } else if (Config.锻造模式 === 1) {
            if (inventory.getInventorySlot(inv, slot - 1).getId() == 0) {
                player.sendMessage("[NWeapon] §c请先在第" + (slot - 1) + "格放入材料");
                event.setCancelled(true);
                return;
            }
        }
    }
}
// 锻造 - 虚拟物品栏关闭事件处理
export function ForgingFakeInvClose (event) {
    var player = event.getPlayer();
    var inv = event.getAction().getInventory();

    let drawing = inventory.getInventorySlot(inv, 0);
    let itemData, weapon;
    if (drawing.getId() === 0) {
        for (let item of inv.getContents().values()) {// 失败，返回所有材料
            blockitem.addItemToPlayer(player, item);
        }
        return player.sendMessage("[NWeapon] §7已取消锻造，未放入图纸");
    }
    let PaperData = onlyNameGetItem('paper', drawing.getCustomName());
    if (!PaperData) {
        for (let item of inv.getContents().values()) {// 失败，返回所有材料
            blockitem.addItemToPlayer(player, item);
        }
        logger.warn("[NWeapon] §7无法获取图纸数据：" + drawing.getCustomName());
        return player.sendMessage("[NWeapon] §7无法获取图纸数据：" + drawing.getCustomName());
    }
    let needList = cloneObjectFn(PlayerSmithingTempData[player.name].方案[0]);
    if (Config.锻造模式 === 0) {// 需要旧装备
        needList.push.apply(PlayerSmithingTempData[player.name].方案[1]);
        weapon = inventory.getInventorySlot(inv, 1);
        itemData = WeaponConfig[weapon.getCustomName()] || ArmorConfig[weapon.getCustomName()];
    } else {
        let tag = PlayerSmithingTempData[player.name].方案[1][0].split('@')[1].split(':');
        itemData = onlyNameGetItem(tag[0], tag[1]);
        weapon = getItem(null, itemData);
    }

    let FnReq = examineNeed(needList, inv, false);
    if (!FnReq[0]) {
        for (let item of inv.getContents().values()) {// 失败，没有足够的需求，返回所有材料
            blockitem.addItemToPlayer(player, item);
        }
        return player.sendMessage("[NWeapon] §7已取消锻造，缺少材料：" + FnReq[1]);
    }
    // 判断图纸是否需要返回
    if (PaperData.消耗) {
        FnReq[1].setItem(0, blockitem.buildItem(0, 0, 0));
    }
    // 锻造石处理
    let Strength = Number(((Math.random().toString().substr(2, 2) - 0 + 1) / 1.7).toFixed(2));// 强度
    for (let i = 0; i < FnReq[1].getSize(); i++) {
        let item = FnReq[1].getItem(i);
        if (!item.getId()) continue;
        if (item.getNamedTag() == null) continue;
        let NameTag = item.getNamedTag().getString('NWeaponNameTag');
        if (NameTag && NameTag.slice(0, NameTag.indexOf(";")) === ItemTypeList["锻造石"] && Strength < 100) {
            let num2 = 0;
            for (let num = 1; num <= item.getCount(); num++) {
                Strength += item.getNamedTag().getString('Strength') * 100;
                num2++;
                if (Strength >= 100) break;
                continue;
            }
            if (item.getCount() === num2) {
                FnReq[1].setItem(i, blockitem.buildItem(0, 0, 0));
            } else {
                let temp = item.clone();
                temp.setCount(item.getCount() - num2);
                FnReq[1].setItem(i, temp);
            }
            if (Strength >= 100) break;// 跳出循环
        }
    }
    if (Strength > 100) {
        Strength = 100;
    }

    for (let item of inv.getContents().values()) {// 将其它材料返回
        blockitem.addItemToPlayer(player, item);
    }

    let paperExp = PlayerSmithingTempData[player.name].获得经验;

    let index = getArrayProbabilisticResults(Config.锻造[1]), addxp = Config.锻造[1].length - index;
    if (paperExp) {
        addxp = 3+(paperExp * (Math.random() > 0.5 ? getRandomNum([1, 2]) : getRandomNum([0, 1])));
    }
    if (Config.ForingExp.onlySameLevel) {
        if (PaperData.限制等级 < PlayerData[player.getName()].level) {
            player.sendMessage("[NWeapon] §7您正在锻造低等级图纸");
            addxp = Config.ForingExp.nonSameLevelGive;
        }
    }
    addxp = Number(addxp.toFixed(2));// 防止浮点数错误
    PlayerData[player.getName()].exp = Math.round((PlayerData[player.getName()].exp + addxp) * 10000) / 10000;
    PlayerData[player.getName()].exp = Number(PlayerData[player.getName()].exp.toFixed(2));// 防止浮点数错误
    PlayerData[player.getName()].level = Math.floor(eval(Config.锻造等级.等级公式.replace(/{经验}/g, PlayerData[player.getName()].exp)));
    if (isNaN(PlayerData[player.getName()].level)) {
        PlayerData[player.getName()].level = 0;
    }
    PlayerData[player.getName()].req = eval(Config.锻造等级.经验公式.replace(/{等级}/g, PlayerData[player.getName()].level + 1)) - PlayerData[player.getName()].exp;
    PlayerData[player.getName()].req = Number(PlayerData[player.getName()].req.toFixed(2));// 防止浮点数错误
    manager.writeFile("./plugins/NWeapon/PlayerData.json", JSON.stringify(PlayerData));
    player.sendMessage("[NWeapon] 恭喜您获得了 §l" + addxp + " §r点锻造经验");
    if (Config.锻造词条 && itemData.锻造词条) {
        WeaponToForgeEntry(player, weapon, index, Strength, PaperData, entryConfigToCraft(ForgeEntry[itemData.锻造词条], itemData));
    } else {
        WeaponToForge(player, weapon, index, Strength, PaperData, itemData);
    }
}