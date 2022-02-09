<template>
    <div class="dice sticker-content-container">
        <img v-show="imageLoaded === false" @click="preview(message)"
             v-bind:src="diceImageUrl">
        <img v-show="imageLoaded" @click="preview(message)" @load="onImageLoaded"
             v-bind:src="diceImageUrl">
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import AnimatedDiceContent from '../../../../../wfc/messages/animatedDiceContent';
import wfc from "../../../../../wfc/client/wfc";

export default {
    name: "DiceMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    data() {
        return {
            imageLoaded: false,
            diceImageUrl: AnimatedDiceContent.getDiceGifUrl(),
        }
    },
    methods: {
        preview(message) {
            // TODO
            console.log('TODO, preview sticker collection');
        },
        onImageLoaded() {
            this.imageLoaded = true
        }
    },
    computed: {
        messageExtra(){
            return this.message.content.extra ? JSON.parse(this.message.content.extra) : null;
        },
        diceValue(){
            return this.message && this.messageExtra ? this.messageExtra['diceValue'] : "1";
        }
    },
    mounted(){
        if(!this.messageExtra['isRotated']){
            setTimeout(() => {
                try{
                    this.diceImageUrl =  AnimatedDiceContent.staticGetDiceImageUrl(this.diceValue);

                }catch(e){}
            }, 1000);
            this.messageExtra['isRotated'] = true;
            const updatedMsg = new AnimatedDiceContent(this.messageExtra['diceValue'], true);
            wfc.updateMessageContent(this.message.messageId, updatedMsg, true, true);
            // updateRemoteMessageContent not working
        }else{
            this.diceImageUrl =  AnimatedDiceContent.staticGetDiceImageUrl(this.diceValue);
        }
    }
}
</script>

<style lang="css" scoped>
.sticker-content-container {
    margin: 0 10px;
    position: relative;
    border: 1px solid #efefef;
    border-radius: 5px;
}

.sticker-content-container img {
    max-height: 200px;
    max-width: 200px;
    border-radius: 5px;
    overflow: hidden;
}

.right-arrow:before {
    border-left-color: white;
}

.left-arrow:before {
    border-left-color: white;
}

</style>
