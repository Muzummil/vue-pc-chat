<template>
    <div class="image-content-container">
        <div v-if="message.messageContent.type == ImageMessageContentType">
            <!-- <viewer :options="viewerOptions" class="images clearfix"> -->
                <img  @click="preview(message, true)" :src="message.content.remoteMediaUrl || message.content.localMediaPath" class="image" @load="onImageLoaded">
            <!-- </viewer> -->
        </div>
        <div v-else>
            <img v-show="imageLoaded === false" @click="preview(message, true)"
                v-bind:src="'data:video/jpeg;base64,' + message.messageContent.thumbnail">
            <img v-show="imageLoaded" @click="preview(message, true)" @load="onImageLoaded"
                draggable="true" v-bind:src="message.messageContent.remotePath">
        </div>
        
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import store from "@/store";
import MessageContentType from "@/wfc/messages/messageContentType";

export default {
    name: "ImageMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },
        isInCompositeView:{
            default: false,
            type: Boolean,
            required: false,
        }
    },
    data() {
        return {
            imageLoaded: false,
            ImageMessageContentType: MessageContentType.Image,
        }
    },
    methods: {
        preview(message, useNewLibImagePreview = false) {
            store.previewMessage(message, true, useNewLibImagePreview);
        },
        onImageLoaded() {
            this.imageLoaded = true
        }
    },
    components: {
    }
}
</script>

<style lang="css" scoped>
.image-content-container {
    margin: 0 10px;
    position: relative;
    border: 1px solid #efefef;
    border-radius: 5px;
}

.image-content-container img {
    max-height: 400px;
    max-width: 400px;
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
