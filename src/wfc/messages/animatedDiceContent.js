/*
 * Copyright (c) 2021 Panda DB Chat. All rights reserved.
 */

import MessageContent from './messageContent'
import MessageContentType from './messageContentType';


export default class AnimatedDiceContent extends MessageContent {
    s3ImagesBaseUrl = "https://chat-admin-pannel.s3.ap-south-1.amazonaws.com/";
    s3DiceGifImageName = "animatedDice.gif";
    s3DiceNumberImagePrefix = "dice_"; //dice_1, dice_2

    diceValue = "1";
    isRotated = false;
    searchableContent = "Dice";

    constructor(diceValue, isRotated = false) {
        super(MessageContentType.MESSAGE_CONTENT_TYPE_DICE_ROTATE);
        this.diceValue = diceValue;
        this.isRotated = isRotated;
    }

    digest() {
        return this.searchableContent;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.searchableContent;
        const payloadExtra = {
            "diceValue": this.diceValue,
            "style": "dice", 
            "isRotated": this.isRotated,
            "remoteMediaUrl": this.getDiceImageUrl(this.diceValue),
            "remotePath": this.getDiceImageUrl(this.diceValue),
        }
        payload.extra = JSON.stringify(payloadExtra);
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        const payloadExtraObj = JSON.parse(JSON.stringify(payload.extra));
        this.diceValue = payloadExtraObj.diceValue;
        this.animating = payloadExtraObj.animating;
        this.isRotated = payload.isRotated;
        this.searchableContent, payloadExtraObj.searchableContent
    }

    getDiceImageUrl(diceValue){
        return this.s3ImagesBaseUrl + this.s3DiceNumberImagePrefix + diceValue + ".png";
    }

    static staticGetDiceImageUrl(diceValue){
        return "https://chat-admin-pannel.s3.ap-south-1.amazonaws.com/dice_" + diceValue + ".png";
    }

    static getDiceGifUrl(){
        return "https://chat-admin-pannel.s3.ap-south-1.amazonaws.com/animatedDice.gif";
    }

}
