# NWeapon
一个基于PNX的由JS编写的PNX-JS插件

此仓库已归档，使用 [NWeaponRe](https://github.com/Mcayear/NWeaponRe) 替代

## 插件命令
| 命令 | 解释 | 权限 |
| --- | --- | --- |
| nwe | 年系列装备插件 | all |
| nwe reload | 重载配置文件 | op |
| nwe give/drop gem/weapon/armor/... [物品名] [玩家名] [数量] | 获取装备 | op |
| nwe 分解 | 分解手持装备 | all |
| nwe 分解快捷栏 | 分解物品快捷栏的装备 | all |
| nwe dz | 打开锻造界面 | all |
| nwe show | 展示手中物品 | all |
| nwe check <attr/dz> [player] | 查询我或他人的数据 | all |
| nwe bind | 绑定手中装备或宝石(无法被他人使用) | all |
| nwe unbind [player] | 解绑手中装备或宝石 | all[op] |
| nwe addnbt [代号] | 将手中物品以代号为名保存至NBT文件 | op |
| nwe delnbt <代号> | 删除NBT文件中指定代号的物品 | op |
| nwe seiko | 精工手中装备 | all |
| nwe lock | 上锁装备(不会被分解) | all |
| nwe unlock | 解锁装备 | all |
| nwe offhand | 将手持物品与副手调换 | all |
| nwe inlay | 装备宝石镶嵌界面 | all |
| nwe rune inlay | 镶嵌符文 | all |
| new rune take | 拆卸符文 | op |
| new rune bore [player] | 为玩家手中装备打符文孔 | op |
| nwe strengthen | 装备强化界面 | all |
| nwe upgrade <当前装备NTag> [目标装备NTag] | 打开一个转换炉用于升级/更新装备 | op |
| nwe effect <玩家名> <属性名> [等级] [时长] | 给予指定玩家指定时长的属性值 | op |
