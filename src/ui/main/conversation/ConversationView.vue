<template>
    <section>
        <div v-if="sharedConversationState.currentConversationInfo == null" class="conversation-empty-container">
            <h1>^~^</h1>
        </div>
        <div v-else class="conversation-container">
            <header>
                <div class="title-container">
                    <h1 class="single-line" @click.stop="toggleConversationInfo">{{ conversationTitle }}</h1>
                    <a href="#"><i class="icon-ion-ios-settings-strong"
                                   style="display: inline-block"
                                   v-bind:style="{marginTop:sharedMiscState.isElectronWindowsOrLinux ?  '30px' : '0'}"
                                   ref="setting"
                                   @click="toggleConversationInfo"/></a>
                </div>
            </header>
            <div ref="conversationContentContainer" class="conversation-content-container"
                 @dragover="dragEvent($event, 'dragover')"
                 @dragleave="dragEvent($event, 'dragleave')"
                 @dragenter="dragEvent($event,'dragenter')"
                 @drop="dragEvent($event, 'drop')"
                 :dummy_just_for_reactive="currentVoiceMessage"
            >
                <!-- Start Pin/Unpin Message -->
                <div v-if="(getPinnedMessage && getPinnedMessage.content) || (pinnedMessage && pinnedMessage.content)" class="pin-messages-container">
                    <div class="flex-row justify-content-between flex-align-center">
                        <div @click.prevent="scrollToPinnedMessage(pinnedMessage)" class="text-section flex-row relative flex-align-center">
                            <div class="pin-line"></div>
                            <div class="pinned-message-content">
                                <div class="flex-column">
                                    <div class="pin-label">Pinned Message</div>
                                    <div class="pin-message">{{(pinnedMessage && pinnedMessage.content) ? pinnedMessage.content.searchableContent : getPinnedMessage.content.searchableContent}}</div>
                                </div>
                            </div>
                        </div>

                        <div v-if="getPinnedMessage.direction == 0" @click.prevent="unpinMessage(pinnedMessage ? pinnedMessage : getPinnedMessage)" class="close-pinned">
                            <div class="cross">
                                X
                            </div>
                        </div>
                    </div>
                </div>
                <!-- End Pin/Unpin Message -->

                <div v-show="dragAndDropEnterCount > 0" class="drag-drop-container">
                    <div class="drag-drop">
                        <p>{{ $t('conversation.drag_to_send_to', [conversationTitle]) }}</p>
                    </div>
                </div>
                <div ref="conversationMessageList" class="conversation-message-list chat-list-container" v-on:scroll="onScroll"
                     infinite-wrapper>
                    <infinite-loading :identifier="loadingIdentifier" force-use-infinite-wrapper direction="top"
                                      @infinite="infiniteHandler">
                        <!--            <template slot="spinner">加载中...</template>-->
                        <template slot="no-more">{{ $t('conversation.no_more_message') }}</template>
                        <template slot="no-results">{{ $t('conversation.all_message_load') }}</template>
                    </infinite-loading>
                    <ul>
                        <li v-for="(message) in sharedConversationState.currentConversationMessageList"
                            :key="message.messageId" :id="message.messageId">
                            <template v-if="message.messageId > 0">
                                <!--todo 不同的消息类型 notification in out-->
                                <NotificationMessageContentView :message="message" v-if="isNotificationMessage(message)"/>
                                <NormalOutMessageContentView
                                    @click.native.capture="sharedConversationState.enableMessageMultiSelection? clickMessageItem($event, message) : null"
                                    :message="message"
                                    v-else-if="message.direction === 0"/>
                                <NormalInMessageContentView
                                    @click.native.capture="sharedConversationState.enableMessageMultiSelection ? clickMessageItem($event, message) : null"
                                    :message="message"
                                    v-else/>
                                <div v-if="showMsgPinIcon(message)" class="pin-icon-container" v-bind:class="{ 'in-msg-icon-start' : message.direction !== 0}">
                                    <img class="tick-icon" src="../../../assets/icons/pin_msg_icon.png" >
                                </div>
                            </template>
                            
                        </li>
                    </ul>
                </div>
                <div v-if="checkShowScrollBtnComp" class="scroll-bottom-btn">
                    <img @click="scrollToBottom" src="../../../assets/images/scroll-down.svg">
                    <!-- <i class="icon-ion-ios-arrow-round-down"></i> -->
                </div>
                <div v-if="sharedConversationState.inputtingUser" class="inputting-container">
                    <img class="avatar" :src="sharedConversationState.inputtingUser.portrait"/>
                    <ScaleLoader :color="'#d2d2d2'" :height="'15px'" :width="'3px'"/>
                </div>
                <div v-show="!sharedConversationState.enableMessageMultiSelection" v-on:mousedown="dragStart"
                     class="divider-handler"></div>
                <MessageInputView :conversationInfo="sharedConversationState.currentConversationInfo"
                                  v-show="!sharedConversationState.enableMessageMultiSelection"
                                  ref="messageInputView"
                                  class="message-input-container"/>
                <MultiSelectActionView v-show="sharedConversationState.enableMessageMultiSelection"/>
                <SingleConversationInfoView
                    v-if="showConversationInfo &&  sharedConversationState.currentConversationInfo.conversation.type === 0"
                    v-click-outside="hideConversationInfo"
                    :conversation-info="sharedConversationState.currentConversationInfo"
                    v-bind:class="{ active: showConversationInfo }"
                    class="conversation-info-container"
                />
                <GroupConversationInfoView
                    v-if="showConversationInfo &&  sharedConversationState.currentConversationInfo.conversation.type === 1"
                    v-click-outside="hideConversationInfo"
                    :conversation-info="sharedConversationState.currentConversationInfo"
                    v-bind:class="{ active: showConversationInfo }"
                    class="conversation-info-container"
                />

                <vue-context ref="menu" v-slot="{data:message}" :close-on-scroll="true" v-on:close="onMenuClose">
                    <!--          更多menu item-->
                    <li v-if="isPinable(message) && !isPinned(message)">
                        <a @click.prevent="pinUnpin(message)"> {{ $t('common.pin_msg') }}</a>
                    </li>
                    <li v-if="isPinable(message) && isPinned(message)">
                        <a @click.prevent="unpinMessage(message)"> {{ $t('common.pin_msg') }}</a>
                    </li>
                    <li v-if="isCopyable(message)">
                        <a @click.prevent="copy(message)">{{ $t('common.copy') }}</a>
                    </li>
                    <li v-if="isDownloadAble(message)">
                        <a @click.prevent="download(message)">{{ $t('common.save') }}</a>
                    </li>
                    <li>
                        <a @click.prevent="delMessage(message)">{{ $t('common.delete') }}</a>
                    </li>
                    <li v-if="isForwardable(message)">
                        <a @click.prevent="_forward(message)">{{ $t('common.forward') }}</a>
                    </li>
                    <li v-if="isFavable(message)">
                        <a @click.prevent="favMessage(message)">{{ $t('common.fav') }}</a>
                    </li>
                    <li v-if="isQuotable(message)">
                        <a @click.prevent="quoteMessage(message)">{{ $t('common.quote') }}</a>
                    </li>
                    <li>
                        <a @click.prevent="multiSelect(message)">{{ $t('common.multi_select') }}</a>
                    </li>
                    <li v-if="isRecallable(message)">
                        <a @click.prevent="recallMessage(message)">{{ $t('common.recall') }}</a>
                    </li>
                    <li v-if="isLocalFile(message)">
                        <a @click.prevent="openFile(message)">{{ $t('common.open') }}</a>
                    </li>
                    <li v-if="isLocalFile(message)">
                        <a @click.prevent="openDir(message)">{{ $t('common.open_dir') }}</a>
                    </li>
                </vue-context>
                <vue-context ref="messageSenderContextMenu" v-slot="{data: message}" :close-on-scroll="true" v-on:close="onMessageSenderContextMenuClose">
                    <!--          更多menu item，比如添加到通讯录等-->
                    <li>
                        <a @click.prevent="mentionMessageSender(message)">{{ mentionMessageSenderTitle(message) }}</a>
                    </li>
                </vue-context>
            </div>
        </div>
    </section>
</template>

<script>
import SingleConversationInfoView from "@/ui/main/conversation/SingleConversationInfoView";
import GroupConversationInfoView from "@/ui/main/conversation/GroupConversationInfoView";
import MessageInputView from "@/ui/main/conversation/MessageInputView";
import ClickOutside from 'vue-click-outside'
import NormalOutMessageContentView from "@/ui/main/conversation/message/NormalOutMessageContentContainerView";
import NormalInMessageContentView from "@/ui/main/conversation/message/NormalInMessageContentContainerView";
import NotificationMessageContentView from "@/ui/main/conversation/message/NotificationMessageContentView";
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import EventType from "@/wfc/client/wfcEvent";
import {numberValue} from "@/wfc/util/longUtil";
import InfiniteLoading from 'vue-infinite-loading';
import MultiSelectActionView from "@/ui/main/conversation/MessageMultiSelectActionView";
import ForwardMessageByPickConversationView from "@/ui/main/conversation/message/forward/ForwardMessageByPickConversationView";
import ForwardMessageByCreateConversationView from "@/ui/main/conversation/message/forward/ForwardMessageByCreateConversationView";
import ScaleLoader from 'vue-spinner/src/ScaleLoader'
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import {fs, isElectron, shell} from "@/platform";
import FileMessageContent from "@/wfc/messages/fileMessageContent";
import ImageMessageContent from "@/wfc/messages/imageMessageContent";
import {copyImg, copyText} from "@/ui/util/clipboard";
import Message from "../../../wfc/messages/message";
import {downloadFile} from "../../../platformHelper";
import VideoMessageContent from "../../../wfc/messages/videoMessageContent";
import localStorageEmitter from "../../../ipc/localStorageEmitter";
import {remote} from "../../../platform";
import SoundMessageContent from "../../../wfc/messages/soundMessageContent";
import MessageContentType from "../../../wfc/messages/messageContentType";
import BenzAMRRecorder from "benz-amr-recorder";
import axios from "axios";
import FavItem from "../../../wfc/model/favItem";
import {stringValue} from "../../../wfc/util/longUtil";
import ConversationType from "../../../wfc/model/conversationType";
import GroupMemberType from "../../../wfc/model/groupMemberType";

var amr;
export default {
    components: {
        MultiSelectActionView,
        NotificationMessageContentView,
        NormalInMessageContentView,
        NormalOutMessageContentView,
        MessageInputView,
        GroupConversationInfoView,
        SingleConversationInfoView,
        InfiniteLoading,
        ScaleLoader,
    },
    // props: ["conversation"],
    data() {
        return {
            conversationInfo: null,
            showConversationInfo: false,
            sharedConversationState: store.state.conversation,
            sharedContactState: store.state.contact,
            sharedPickState: store.state.pick,
            sharedMiscState: store.state.misc,
            isHandlerDragging: false,

            savedMessageListViewHeight: -1,
            saveMessageListViewFlexGrow: -1,

            dragAndDropEnterCount: 0,
            // FIXME 选中一个会话，然后切换到其他page，比如联系人，这时该会话收到新消息或发送消息，会导致新收到/发送的消息的界面错乱，尚不知道原因，但这么做能解决。
            fixTippy: false,
            showScrollButton:  false,
            pinnedMessage: store.state.conversation.currentConversationMessageList.pinnedMessage
        };
    },

    activated() {
        this.fixTippy = true;
        this.$eventBus.$on('force-scroll-conversation-bottom', args=> {
            this.scrollToBottom();
        });

        this.$eventBus.$on('pin-unpin-change', args=> {
            console.log("EVENT")
            this.resetPinnedMessages();
        })
        wfc.eventEmitter.on(EventType.PinMessage, () => {
            console.log("EVENT222")
            this.resetPinnedMessages();
        });
        wfc.eventEmitter.on(EventType.UnpinMessage, () => {
            console.log("EVENT3333")
            this.resetPinnedMessages();
        });
    },

    deactivated() {
        this.fixTippy = false;
    },

    methods: {
        dragEvent(e, v) {
            if (v === 'dragenter') {
                this.dragAndDropEnterCount++;
            } else if (v === 'dragleave') {
                this.dragAndDropEnterCount--;
            } else if (v === 'drop') {
                this.dragAndDropEnterCount--;
                let isFile;
                if (e.dataTransfer.items) {
                    if (typeof (e.dataTransfer.items[0].webkitGetAsEntry) == "function") {
                        isFile = e.dataTransfer.items[0].webkitGetAsEntry().isFile;
                    } else if (typeof (e.dataTransfer.items[0].getAsEntry) == "function") {
                        isFile = e.dataTransfer.items[0].getAsEntry().isFile;
                    }
                } else {
                    return true;
                }
                if (!isFile) {
                    this.$notify({
                        // title: '不支持',
                        text: this.$t('conversation.not_support_send_folder'),
                        type: 'warn'
                    });
                    return true;
                }

                let length = e.dataTransfer.files.length;
                if (length > 0 && length < 5) {
                    for (let i = 0; i < length; i++) {
                        this.$eventBus.$emit('uploadFile', e.dataTransfer.files[i])
                        store.sendFile(this.sharedConversationState.currentConversationInfo.conversation, e.dataTransfer.files[i]);
                    }
                } else {
                    this.$notify({
                        // title: '大文件提示',
                        text: this.$t('conversation.drag_to_send_limit_tip'),
                        type: 'warn'
                    });
                }
            } else if (v === 'dragover') {
                // If not st as 'copy', electron will open the drop file
                e.dataTransfer.dropEffect = 'copy';
            }
        },
        toggleConversationInfo() {
            this.showConversationInfo = !this.showConversationInfo;
        },
        scrollToPinnedMessage(pinnedMessage){
            document.getElementById(pinnedMessage.messageId).scrollIntoView({
                behavior: "smooth",
                block: 'center'
            });
        },
        toggleMessageMultiSelectionActionView(message) {
            if (!this.sharedConversationState.enableMessageMultiSelection) {
                this.saveMessageListViewFlexGrow = this.$refs['conversationMessageList'].style.flexGrow;
                this.savedMessageListViewHeight = this.$refs['conversationMessageList'].style.height;
                this.$refs['conversationMessageList'].style.flexGrow = 1;
            } else {
                if (this.saveMessageListViewFlexGrow !== -1 && this.savedMessageListViewHeight !== -1) {
                    this.$refs['conversationMessageList'].style.height = this.savedMessageListViewHeight;
                    this.$refs['conversationMessageList'].style.flexGrow = this.saveMessageListViewFlexGrow;
                }
            }
            this.sharedPickState.messages.forEach(m => console.log(m.messageId));
            store.toggleMessageMultiSelection(message);
        },

        clickMessageItem(event, message) {
            if (message.messageContent instanceof NotificationMessageContent) {
                return;
            }
            if (this.sharedConversationState.enableMessageMultiSelection) {
                store.selectOrDeselectMessage(message);
                event.stopPropagation();
            }
        },

        hideConversationInfo() {
            // TODO
            // 是否在创建群聊，或者是在查看会话参与者信息
            this.showConversationInfo && (this.showConversationInfo = false);
        },

        isNotificationMessage(message) {
            return message && message.messageContent instanceof NotificationMessageContent;
        },
        checkShowScrollBtn() {
            let messageListContainerElement = this.$refs['conversationMessageList'];
            if( messageListContainerElement && (messageListContainerElement.offsetHeight + messageListContainerElement.scrollTop) < messageListContainerElement.scrollHeight - 400){
                this.showScrollButton = true; 
            }else{
                this.showScrollButton = false; 
            }
        },

        onScroll(e) {
            
            store.setForceScrollToBottom(false);
            this.checkShowScrollBtn();
            // hide tippy userCard
            for (const popper of document.querySelectorAll('.tippy-popper')) {
                const instance = popper._tippy;
                if (instance.state.isVisible) {
                    instance.hide();
                }
            }
            // hide message context menu
            this.$refs.menu && this.$refs.menu.close();

            // 当用户往上滑动一段距离之后，收到新消息，不自动滚到到最后
            if (e.target.scrollHeight > e.target.clientHeight + e.target.scrollTop + e.target.clientHeight / 2) {
                // store.setShouldAutoScrollToBottom(false)
            } else {
                store.setShouldAutoScrollToBottom(true)
                store.clearConversationUnreadStatus(this.sharedConversationState.currentConversationInfo.conversation);
            }
        },

        dragStart() {
            this.isHandlerDragging = true;
            console.log('drag start')
        },

        drag(e) {
            // Don't do anything if dragging flag is false
            if (!this.isHandlerDragging) {
                return false;
            }

            // Get offset
            let containerOffsetTop = this.$refs['conversationContentContainer'].offsetTop;

            // Get x-coordinate of pointer relative to container
            let pointerRelativeYpos = e.clientY - containerOffsetTop;

            // Arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
            let boxAminHeight = 150;

            // Resize box A
            // * 8px is the left/right spacing between .handler and its inner pseudo-element
            // * Set flex-grow to 0 to prevent it from growing
            this.$refs['conversationMessageList'].style.height = (Math.max(boxAminHeight, pointerRelativeYpos)) + 'px';
            this.$refs['conversationMessageList'].style.flexGrow = 0;

        },

        dragEnd() {
            this.isHandlerDragging = false;
        },

        onMenuClose() {
            this.$emit('contextMenuClosed')
        },
        onMessageSenderContextMenuClose() {
            console.log('onMessageSenderContextMenuClose')
        },

        // message context menu
        isCopyable(message) {
            return message && (message.messageContent instanceof TextMessageContent || message.messageContent instanceof ImageMessageContent);
        },
        isPinable(message) {
            return message && (message.messageContent instanceof TextMessageContent) && message.direction == 0;
        },
        isPinned(message) {
            let msgExtra = message.messageContent.extra; 
            let isPinned = false;
            console.log(msgExtra)
            if(!msgExtra || msgExtra == ''){
                return false;
            }
            if(typeof msgExtra !== 'string' && msgExtra.isPinned){
                isPinned = true;
            }else if(JSON.parse(msgExtra).isPinned){
                isPinned = true;
            }else{
                isPinned = false;
            }
            console.log("isPinned", isPinned)
            return isPinned;
        },
        isDownloadAble(message) {
            return message && (message.messageContent instanceof ImageMessageContent
                || message.messageContent instanceof FileMessageContent
                || message.messageContent instanceof VideoMessageContent);
        },

        isForwardable(message) {
            if (message && message.messageContent instanceof SoundMessageContent) {
                return false;
            }
            return true;
        },

        isFavable(message) {
            if (!message) {
                return false;
            }
            return [MessageContentType.VOIP_CONTENT_TYPE_START,
                MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE].indexOf(message.messageContent.type) <= -1;
        },

        isRecallable(message) {
            if (message) {
                if (message.conversation.type === ConversationType.Group) {
                    let groupInfo = wfc.getGroupInfo(message.conversation.target);
                    let selfUserId = wfc.getUserId();
                    if (groupInfo && groupInfo.owner === selfUserId) {
                        return true;
                    }

                    let groupMember = wfc.getGroupMember(message.conversation.target, selfUserId);
                    if (groupMember && [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) > -1) {
                        return true;
                    }
                }
                if (message.direction === 0 && new Date().getTime() - numberValue(message.timestamp) < 60 * 1000) {
                    return true;
                }
            }
            return false;
        },

        isLocalFile(message) {
            if (message && isElectron()) {
                let media = message.messageContent;
                let localPath = media.localPath;
                if (localPath) {
                    return fs.existsSync(localPath);
                }
            }
            return false;
        },

        isQuotable(message) {
            if (!message) {
                return false;
            }
            return [MessageContentType.VOIP_CONTENT_TYPE_START,
                MessageContentType.Voice,
                MessageContentType.Video,
                MessageContentType.Composite_Message,
                MessageContentType.CONFERENCE_CONTENT_TYPE_INVITE].indexOf(message.messageContent.type) <= -1;
        },

        copy(message) {
            let content = message.messageContent;
            if (content instanceof TextMessageContent) {
                let selectedText = window.getSelection().toString()
                if (selectedText) {
                    copyText(selectedText);
                } else {
                    copyText(content.content)
                }
            } else {
                copyImg(content.remotePath)
            }
        },
        unpinMessage(message){
            console.log("UNPIN")
            let unpinExtra = {
                "isPinned": false,
                "isUpdated": false
            }
            message.messageContent.extra = JSON.stringify(unpinExtra);
            this.updateMsgPinStatus(message);
        },
        pinUnpin(message){
            console.log("START", message);
            debugger
            message = this.toggleMessageExtra(message);
            console.log("MSG22", stringValue(message.messageUid));
            console.log("MSG", message);
            debugger
            store.updatePinnedStatusBeforeNewPinned(message, ()=>{
                console.log("GOTIT", message)
                debugger
                this.updateMsgPinStatus(message);
            });

        },
        toggleMessageExtra(message){
            console.log("BEFORE TOGGLE", JSON.stringify(message))
            let msgExtra = message.messageContent ? message.messageContent.extra : null;
            let msgOverriddenExtra;
            if(msgExtra && msgExtra !== ''){
                msgOverriddenExtra = {
                    "isPinned": !(JSON.parse(msgExtra).isPinned),
                    "isUpdated": false
                }
            }else{
                msgOverriddenExtra = {
                    "isPinned": true,
                    "isUpdated": false
                }
            }
            message.messageContent.extra = JSON.stringify(msgOverriddenExtra);
            console.log("AFTER TOGGLE", JSON.stringify(message))
            return message;
        },
        updateMsgPinStatus(message){
            wfc.pinUnpinMessage(message, ()=>{
                debugger
                console.log("TRIGGERED");
                this.$eventBus.$emit('pin-unpin-change', true);
            }, true);
        },
        download(message) {
            if (isElectron()) {
                downloadFile(message);
            } else {
                if (!store.isDownloadingMessage(message.messageId)) {
                    downloadFile(this.message)
                    store.addDownloadingMessage(message.messageId)
                } else {
                    // TODO toast 下载中
                    console.log('file isDownloading')
                }
            }
        },

        openFile(message) {
            let file = message.messageContent;
            shell.openItem(file.localPath);
        },

        openDir(message) {
            let file = message.messageContent;
            shell.showItemInFolder(file.localPath);
        },

        recallMessage(message) {
            wfc.recallMessage(message.messageUid, null, null);
        },

        delMessage(message) {
            wfc.deleteMessage(message.messageId);
        },

        forward(message) {
            return this.pickConversationAndForwardMessage(ForwardType.NORMAL, [message]);
        },

        _forward(message) {
            this.forward(message).catch(() => {
                // do nothing
            });
        },

        quoteMessage(message) {
            store.quoteMessage(message);
        },

        // call from child
        favMessages(messages) {
            console.log('fav messages');
            let compositeMessageContent = new CompositeMessageContent();
            let title = '';
            let msgConversation = messages[0].conversation;
            if (msgConversation.type === ConversationType.Single) {
                let users = store.getUserInfos([wfc.getUserId(), msgConversation.target], '');
                title = users[0]._displayName + '和' + users[1]._displayName + '的聊天记录';
            } else {
                title = '群的聊天记录';
            }
            compositeMessageContent.title = title;
            compositeMessageContent.messages = messages;

            let message = new Message(msgConversation, compositeMessageContent);
            message.from = wfc.getUserId();
            this.favMessage(message);
        },

        favMessage(message) {
            let favItem = FavItem.fromMessage(message);
            axios.post('/fav/add', {
                messageUid: stringValue(favItem.messageUid),
                type: favItem.favType,
                convType: favItem.conversation.type,
                convTarget: favItem.conversation.target,
                convLine: favItem.conversation.line,
                origin: favItem.origin,
                sender: favItem.sender,
                title: favItem.title,
                url: favItem.url,
                thumbUrl: favItem.thumbUrl,
                data: favItem.data,
            }, {withCredentials: true})
                .then(response => {
                    if (response && response.data && response.data.code === 0) {
                        this.$notify({
                            // title: '收藏成功',
                            text: '收藏成功',
                            type: 'info'
                        });
                    } else {
                        this.$notify({
                            // title: '收藏成功',
                            text: '收藏失败',
                            type: 'error'
                        });
                    }
                })
                .catch(err => {
                    this.$notify({
                        // title: '收藏失败',
                        text: '收藏失败',
                        type: 'error'
                    });

                })
        },

        multiSelect(message) {
            this.toggleMessageMultiSelectionActionView(message);
        },

        infiniteHandler($state) {
            console.log('to load more message');
            store.loadConversationHistoryMessages(() => {
                console.log('loaded')
                $state.loaded();
            }, () => {
                console.log('complete')
                $state.complete()
            });
        },

        pickConversationAndForwardMessage(forwardType, messages) {
            return new Promise(((resolve, reject) => {
                let beforeClose = (event) => {
                    console.log('Closing...', event, event.params)
                    // What a gamble... 50% chance to cancel closing
                    if (event.params.toCreateConversation) {
                        console.log('to show')
                        Promise.race([this.createConversationAndForwardMessage(forwardType, messages)])
                            .then(resolve)
                            .catch(reject);
                    } else if (event.params.confirm) {
                        let conversations = event.params.conversations;
                        let extraMessageText = event.params.extraMessageText;
                        // TODO 多选转发
                        store.forwardMessage(forwardType, conversations, messages, extraMessageText)
                        resolve();
                    } else {
                        console.log('cancel')
                        reject();
                    }
                };

                this.$modal.show(
                    ForwardMessageByPickConversationView,
                    {
                        forwardType: forwardType,
                        messages: messages
                    }, {
                        name: 'forward-by-pick-conversation-modal',
                        width: 600,
                        height: 480,
                        clickToClose: false,
                    }, {
                        'before-close': beforeClose,
                    })
            }));
        },

        createConversationAndForwardMessage(forwardType, messages) {
            return new Promise(((resolve, reject) => {

                let beforeClose = (event) => {
                    console.log('Closing...', event, event.params)
                    if (event.params.backPickConversation) {
                        Promise.race([this.pickConversationAndForwardMessage(forwardType, messages)])
                            .then(resolve)
                            .catch(reject);
                    } else if (event.params.confirm) {
                        let users = event.params.users;
                        let extraMessageText = event.params.extraMessageText;
                        store.forwardByCreateConversation(forwardType, users, messages, extraMessageText)
                        resolve();
                    } else {
                        console.log('cancel')
                        reject();
                    }
                };
                this.$modal.show(
                    ForwardMessageByCreateConversationView,
                    {
                        forwardType: forwardType,
                        messages: messages,
                        users: this.sharedContactState.friendList,
                    }, {
                        name: 'forward-by-create-conversation-modal',
                        width: 600,
                        height: 480,
                        clickToClose: false,
                    }, {
                        'before-close': beforeClose,
                    });
            }));
        },
        playVoice(message) {
            if (amr) {
                amr.stop();
            }
            amr = new BenzAMRRecorder();
            let voice = message.messageContent;
            amr.initWithUrl(voice.remotePath).then(() => {
                message._isPlaying = true;
                amr.play();
            });
            amr.onEnded(() => {
                message._isPlaying = false;
                store.playVoice(null)
            })
        },
        scrollToBottom(){
            let messageListElement = this.$refs['conversationMessageList'];
            if(messageListElement){
                setTimeout(() => {
                    messageListElement.scrollTop = messageListElement.scrollHeight + 100000;
                }, 10);
            }
        },
        mentionMessageSenderTitle(message) {
            if (!message){
                return ''
            }
            let displayName = wfc.getGroupMemberDisplayName(message.conversation.target, message.from);
            return '@' + displayName;
        },

        mentionMessageSender(message) {
            this.$refs.messageInputView.mention(message.conversation.target, message.from);
        },
        resetPinnedMessages(){
            let pinnedMessage = this.sharedConversationState.currentConversationMessageList.filter(message=>  {
                if(message.content.extra && JSON.parse(message.content.extra).isPinned){
                    console.log("EX", JSON.parse(message.content.extra))
                    return message
                }

            })[0];
            console.log("pinnedMessages",pinnedMessage)
            // this.pinnedMessage = pinnedMessage;
            this.$set(this, "pinnedMessage", pinnedMessage)
            setTimeout(() => {
                this.getMessages();
            }, 500);
             setTimeout(() => {
                this.getMessages();
            }, 1000);
        },
        getMessages(){
            console.log("END", this.sharedConversationState.currentConversationMessageList)
                let pinnedMessage = {};
                 for(let i=0;i < this.sharedConversationState.currentConversationMessageList.length; i++){
                    let msg = this.sharedConversationState.currentConversationMessageList[i];
                    let msgExtra = msg.messageContent.extra;
                    if(msgExtra){
                        if(typeof msgExtra !== 'string' && msgExtra.isPinned){
                            pinnedMessage = msg;
                        }else if(JSON.parse(msg.messageContent.extra).isPinned){
                            pinnedMessage = msg;
                        }
                    }
                }

                // for(let i=0; i < this.sharedConversationState.currentConversationMessageList.length; i++){
                //     let message = this.sharedConversationState.currentConversationMessageList[i];
                //     // message.content.extra = JSON.stringify(message.content.extra);
                //     let parsedExtra;
                //     try{
                //         parsedExtra = JSON.parse(message.messageContent.extra);
                //     }catch(e){
                //         console.log(e);
                //     }
                //     setTimeout(() => {
                //         console.log("CCCCCCC", message, message.messageContent.extra, parsedExtra['isPinned'])
                //         if(parsedExtra && parsedExtra['isPinned']){
                //             console.log("EX", parsedExtra)
                //             pinnedMessage = message;
                //             return;
                //         }    
                //     }, 100);
                    
                // }
                // let pinnedMessage = this.sharedConversationState.currentConversationMessageList.filter(message=>  {
                //     console.log("CCCCCCC", message.content.extra, JSON.parse(message.content.extra)['isPinned'])
                //     if(message.content.extra && message.content.extra !== ''){
                //         console.log("EX", JSON.parse(message.content.extra))
                //         return message
                //     }

                // });
                this.$set(this, "pinnedMessage", pinnedMessage)
                console.log("pinnedMessages",pinnedMessage)
                return pinnedMessage;
        },
         getUniqueListBy(arr, key = 'messageUid') {
            return [...new Map(arr.map(item => [ stringValue(item[key]), item])).values()]
        },
        showMsgPinIcon(message){
            let ret = false;
            let msgExtra = message.messageContent.extra; 
            if(msgExtra){
                if(typeof msgExtra !== 'string' && msgExtra.isPinned){
                    ret = true;
                }else if(JSON.parse(message.messageContent.extra).isPinned){
                    ret = true;
                }
            }
            return ret;
            // if(message.messageContent && message.messageContent.extra){
            //     return JSON.parse(message.messageContent.extra).isPinned ? true : false;
            // }

            // return false;
        }
    },

    mounted() {
        this.popupItem = this.$refs['setting'];
        document.addEventListener('mouseup', this.dragEnd);
        document.addEventListener('mousemove', this.drag);

        this.$on('openMessageContextMenu', (event, message) => {
            this.$refs.menu.open(event, message);
        });

        this.$on('openMessageSenderContextMenu', (event, message) => {
            // 目前只支持群会话里面，消息发送者右键@
            if (message.conversation.type === ConversationType.Group) {
                this.$refs.messageSenderContextMenu.open(event, message);
            }
        });

        this.$eventBus.$on('send-file', args => {
            let fileMessageContent = new FileMessageContent(null, args.remoteUrl, args.name, args.size);
            let message = new Message(null, fileMessageContent);
            this.forward(message)
        });

        this.$eventBus.$on('forward-fav', args => {
            let favItem = args.favItem;
            let message = favItem.toMessage();
            this.forward(message);
        });

        localStorageEmitter.on('inviteConferenceParticipant', (ev, args) => {
            if (isElectron()) {
                remote.getCurrentWindow().focus();
            }
            let payload = args.messagePayload;
            let messageContent = Message.messageContentFromMessagePayload(payload, wfc.getUserId());
            let message = new Message(null, messageContent);
            this.forward(message)
                .then(() => {
                    ev.reply('inviteConferenceParticipantDone')
                })
                .catch(() => {
                    ev.reply('inviteConferenceParticipantCancel')
                });
        });
        this.scrollToBottom();
        // if (this.sharedConversationState.shouldAutoScrollToBottom) {
        //     this.scrollToBottom();
        // } else {
        //     // 用户滑动到上面之后，收到新消息，不自动滑动到最下面
        // }
    },

    beforeDestroy() {
        document.removeEventListener('mouseup', this.dragEnd);
        document.removeEventListener('mousemove', this.drag);
        this.$eventBus.$off('send-file')
        this.$eventBus.$off('forward-fav')
    },

    beforeUpdate(){
        console.log("BEFORE UPDATE", this.sharedConversationState.forceScrollToBottom)
        if(this.sharedConversationState.forceScrollToBottom){
            this.scrollToBottom();
        }
    },
    updated() {
        if (!this.sharedConversationState.currentConversationInfo) {
            return;
        }
        // this.resetPinnedMessages();
    },
    updated() {
        this.popupItem = this.$refs['setting'];
        // refer to http://iamdustan.com/smoothscroll/
        if (this.sharedConversationState.currentConversationInfo) {
            if (!this.sharedMiscState.isPageHidden) {
                let unreadCount = this.sharedConversationState.currentConversationInfo.unreadCount;
                if (unreadCount.unread > 0) {
                    store.clearConversationUnreadStatus(this.sharedConversationState.currentConversationInfo.conversation);
                }
            }
        }

        if (this.conversationInfo && this.sharedConversationState.currentConversationInfo && !this.conversationInfo.conversation.equal(this.sharedConversationState.currentConversationInfo.conversation)) {
            this.showConversationInfo = false;
        }
        this.conversationInfo = this.sharedConversationState.currentConversationInfo;
        // this.sharedConversationState.forceScrollToBottom = false;
        console.log("conversationInfo", this.conversationInfo)
    },    

    computed: {
        conversationTitle() {
            let info = this.sharedConversationState.currentConversationInfo;
            return info.conversation._target._displayName;
        },
        loadingIdentifier() {
            let conversation = this.sharedConversationState.currentConversationInfo.conversation;
            return conversation.type + '-' + conversation.target + '-' + conversation.line;
        },
        currentVoiceMessage() {
            let voice = this.sharedConversationState.currentVoiceMessage;
            if (voice) {
                this.playVoice(voice);
            } else {
                if (amr) {
                    amr.stop();
                }
            }
            return null;
        },
        checkShowScrollBtnComp(){
            return this.showScrollButton;
        },
        getPinnedMessage: {
            get(){
                
                // this.pinnedMessage = pinnedMessage;
                return this.getMessages();
            }
        }
    },

    directives: {
        ClickOutside
    },
};
</script>

<style lang="css" scoped>
.conversation-empty-container {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
    /*border-left: 1px solid #e6e6e6;*/
}

.conversation-empty-container h1 {
    font-size: 17px;
    font-weight: normal;
}

.title-container {
    width: 100%;
    height: 60px;
    display: flex;
    padding: 0 0 0 20px;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e6e6e6;
    border-top-right-radius: var(--main-border-radius);
    position: relative;
}


.title-container h1 {
    font-size: 16px;
    font-weight: normal;
}

.title-container a {
    text-decoration: none;
    padding: 15px;
    color: #181818;
}

.title-container a:active {
    color: #d6d6d6;
}

.conversation-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.conversation-container header {
    border-top-right-radius: var(--main-border-radius);
}

.conversation-container header {
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e6e6e6;
}

.conversation-content-container {
    flex: 1;
    height: calc(100% - 60px);
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: #f3f3f3;
    border-bottom-right-radius: var(--main-border-radius);
}

.conversation-content-container .drag-drop-container {
    position: absolute;
    background-color: #f2f2f2a5;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    height: 100%;
    padding: 20px 15px 15px 15px;
}

.conversation-content-container .drag-drop {
    border: 2px dashed #b2b2b2;
    height: 100%;
    width: 100%;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.conversation-content-container .drag-drop p {
    padding-bottom: 100px;
}

.conversation-message-list {
    flex: 1 1 auto;
    overflow: auto;
}

.conversation-message-list ul {
    list-style: none;
}

/*.handler {*/
/*  height: 1px;*/
/*  background-color: #e2e2e2;*/
/*}*/

.inputting-container {
    display: flex;
    padding: 10px 20px;
    align-items: center;
}

.inputting-container .avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
    margin-right: 20px;
}

.divider-handler::before {
    cursor: row-resize;
    content: '';
    display: block;
    width: 100%;
    height: 3px;
    border-top: 1px solid #e2e2e2;
    margin: 0 auto;
}

.message-input-container {
    height: 200px;
    min-height: 200px;
}

.conversation-info-container {
    display: none;
    width: 250px;
    height: 100%;
    top: 0;
    right: 0;
    position: absolute;
    background-color: #ffffffe5;
    backdrop-filter: blur(6px);
    border-left: 1px solid #e6e6e6;
}

.conversation-info-container.active {
    display: flex;
}
.chat-list-container{
    position: relative;
}
.scroll-bottom-btn{
    position: absolute;
    right: 1rem;
    top: 62%;
}
.scroll-bottom-btn{
    font-size: 1.7rem;
    cursor: pointer;
}
.scroll-bottom-btn img{
    border: 2px solid #dcdee4;
    border-radius: 50%;
}
.scroll-bottom-btn img:active{
    border: 2px solid #5f77bd;
    border-radius: 50%;
}
.pin-messages-container{
    position: absolute;
    padding: 7px 20px;
    /* background: #F3BE5B; */
    width: 100%;
    z-index: 100;
    background: whitesmoke;
    border-top: 1px solid #cbc4c4;
    border-bottom: 1px solid #cbc4c4;
}
.pin-messages-container .pin-line{
    height: 100%;
    border-right: 2px solid #5f77bd;
    position: absolute;
    left: 0;
}
.pin-messages-container{
    width: 100%;
    text-overflow: ellipsis;
}
.pinned-message-content{
    margin-left: 12px;
}
.justify-content-between{
    justify-content: space-between;
}
.pin-label{
    font-size: 13px;
    font-weight: bold;
    color: #5f77bd;
}
.pin-message{
    font-size: 12px;
    color: black;
}
.close-pinned{
    border: 1px solid #5f77bd;
    border-radius: 50%;
    /* padding: 5px; */
    width: 20px;
    height: 20px;
    /* align-items: center; */
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
}
.cross{
    color: #5f77bd;
}
.pin-icon-container {
    display: flex;
    justify-content: flex-end;
    padding: 0px 50px;
    align-items: center;
    margin-top: -22px;
}
.pin-icon-container.in-msg-icon-start {
    justify-content: flex-start !important;
}
.pin-icon-container img{
    width: 15px
}
.text-section{
    cursor: pointer;
}
</style>
