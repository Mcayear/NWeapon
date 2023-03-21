import { EventPriority, PowerNukkitX as pnx } from ":powernukkitx";
import { JavaClassBuilder } from ":jvm";
import { Skin } from "cn.nukkit.entity.data.Skin";
import { EntityHuman } from "cn.nukkit.entity.EntityHuman";
import { Entity } from "cn.nukkit.entity.Entity";
import { Server } from "cn.nukkit.Server";
import { BlockID } from "cn.nukkit.block.BlockID";
import { Base64 } from "java.util.Base64";
import { Files } from "java.nio.file.Files";
import { Paths } from "java.nio.file.Paths";

function getMoudle() {
    const skin = new Skin();
    skin.setTrusted(true);
    skin.setSkinId("Standard_Custom");
    skin.setSkinData(Base64.getDecoder().decode(Files.readString(Paths.get('./plugins/@NWeaponRe/resource/skinData.txt'))));
    return skin;
}
/**
 * @class
 */
export const FloatTextEntity = new JavaClassBuilder("FloatTextEntity", EntityHuman)
    .setJSDelegate({
        new(chunk, nbt) {
            console.log(chunk);
            console.log(nbt);
            return [chunk, nbt];
        },
        /**
         * @arg javaThis {cn.nukkit.entity.EntityIntelligent}
         */
        constructor(javaThis) {
            javaThis.setNameTagAlwaysVisible(true);
            javaThis.setNameTagVisible(true);
            javaThis.setNameTag("PNX JS Sheep");


            javaThis.setSkin(getMoudle())
            javaThis.spawnToAll();
        },
        getNetworkId() {
            return 13;
        },
        getWidth() {
            return 0.9;
        },
        getHeight() {
            return 1.3;
        },
        getGravity() {// 重力
            return 0.04;
        },
        getDrag() {
            return 0.02;
        },
        getNearestPlayer(javaThis, far) {
            let nearest = null;
            let distance = 999999999;
            for (let p of Server.getInstance().getOnlinePlayers().values()) {
                if (!p.level.getName().equals(javaThis.level.getName()) || p.distance(javaThis) > far) {
                    continue;
                } else {
                    let d = javaThis.distance(p);
                    if (distance > d) {
                        nearest = p;
                        distance = d;
                    }
                }
            }
            return nearest;
        },
        lookAt(javaThis, pos) {
            let xdiff = pos.x - javaThis.x;
            let zdiff = pos.z - javaThis.z;
            let angle = Math.atan2(zdiff, xdiff);
            let yaw = ((angle * 180) / Math.PI) - 90;
            let ydiff = pos.y - javaThis.y;
            let v = {x: javaThis.x, z: javaThis.z};
            let dist = Math.sqrt(Math.pow((pos.x - v.x),2) + Math.pow((pos.z - v.z),2));
            angle = Math.atan2(dist, ydiff);
            let pitch = ((angle * 180) / Math.PI) - 90;
            javaThis.yaw = yaw;
            javaThis.pitch = pitch;
        },
        /**
         * @arg javaThis {cn.nukkit.entity.EntityIntelligent}
         */
        onUpdate(javaThis, currentTick) {
            const ret = javaThis.__super__onUpdate(currentTick);
            console.log(currentTick);
            /*if (!(currentTick % 60)) {
                javaThis.close();
            }*/
            if (javaThis.isInsideOfFire() || javaThis.isInsideOfLava()) {
                javaThis.close();
            }
            let bid = javaThis.level.getBlockIdAt(Math.floor(javaThis.x), Math.floor(javaThis.boundingBox.getMaxY()), Math.floor(javaThis.z), 0);
            if (bid == BlockID.FLOWING_WATER || bid == BlockID.STILL_WATER
                || (bid = javaThis.level.getBlockIdAt(Math.floor(javaThis.x), Math.floor(javaThis.boundingBox.getMaxY()), Math.floor(javaThis.z), 1)) == BlockID.FLOWING_WATER
                || bid == BlockID.STILL_WATER
            ) {
                //item is fully in water or in still water
                javaThis.motionY -= javaThis.getGravity() * -0.015;
            } else if (javaThis.isInsideOfWater()) {
                javaThis.motionY = javaThis.getGravity() - 0.06; //item is going up in water, don't let it go back down too fast
            } else {
                javaThis.motionY -= javaThis.getGravity(); //item is not in water
            }
            javaThis.move(javaThis.motionX, javaThis.motionY, javaThis.motionZ);
            let friction = 1 - javaThis.getDrag();
            if (javaThis.onGround && (Math.abs(javaThis.motionX) > 0.00001 || Math.abs(javaThis.motionZ) > 0.00001)) {
                friction *= javaThis.getLevel().getBlock(javaThis.temporalVector.setComponents(Math.floor(javaThis.x), Math.floor(javaThis.y - 1), Math.floor(javaThis.z))).getFrictionFactor();

            }

            javaThis.motionX *= friction;
            javaThis.motionY *= 1 - javaThis.getDrag();
            javaThis.motionZ *= friction;
            if (javaThis.onGround) {
                javaThis.motionY *= -0.5;
            }

            javaThis.updateMovement();
            return ret;
        },
        close(javaThis) {
            javaThis.__super__close();
        }
    }).addJavaConstructor("new", "constructor", ["cn.nukkit.level.format.FullChunk", "cn.nukkit.nbt.tag.CompoundTag"], "cn.nukkit.level.format.FullChunk", "cn.nukkit.nbt.tag.CompoundTag")
    .addJavaMethod("getNetworkId", "getNetworkId", "int")
    .addJavaMethod("getWidth", "getWidth", "float")
    .addJavaMethod("getHeight", "getHeight", "float")
    .addJavaMethod("getGravity", "getGravity", "float")
    .addJavaMethod("getDrag", "getDrag", "float")
    .addJavaSuperMethod("getNearestPlayer", "cn.nukkit.Player", "int")
    .addJavaMethod("getNearestPlayer", "getNearestPlayer", "cn.nukkit.Player", "int")
    .addJavaSuperMethod("lookAt", "void", "cn.nukkit.level.Position")
    .addJavaMethod("lookAt", "lookAt", "void", "cn.nukkit.level.Position")
    .addJavaSuperMethod("onUpdate", "boolean", "int")
    .addJavaMethod("onUpdate", "onUpdate", "boolean", "int")
    .addJavaSuperMethod("close", "void")
    .addJavaMethod("close", "close", "void")
    .compileToJavaClass();

export function main() {
    pnx.listenEvent("cn.nukkit.event.player.PlayerInteractEvent", EventPriority.NORMAL, e => {
        if (e.getItem().getNamespaceId() === "minecraft:stick") {
            const level = e.getPlayer().getLevel();
            
        }
    })
}

