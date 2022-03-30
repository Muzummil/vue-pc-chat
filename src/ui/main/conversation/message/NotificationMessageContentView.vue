<template>
    <div class="notification-container">
        <p class="notification">{{ message.messageContent.digest(message) }} 
            <span @click="setMessage" v-if="isMessageCanBeRecalled(message)"> 一 <a class="recall-again"> {{ $t('common.recall') }} </a> </span>
        </p>
    </div>
</template>

<script>

import Message from "@/wfc/messages/message";

export default {
    name: "NotificationMessageContentView",
    props: {
        message: {
            type: Message,
            required: true
        }
    },
    methods:{
        setMessage(){
            this.$eventBus.$emit('recall-message-content', this.message);
        },
        isMessageCanBeRecalled(message){
            return  message.messageContent.fromSelf && message.messageContent.originalContentType === 1;
        },
    },
    components: {}
}
</script>

<style lang="css" scoped>
.notification-container {
    display: flex;
    justify-content: center;
}

.notification-container .notification {
    color: #b8b8b8;
    margin: 20px 0;
    font-size: 14px;
}
.recall-again{
    text-decoration: underline;
    color: blue;
    cursor: pointer;
}

</style>
