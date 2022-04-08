<template>
    <section class="user-detail-container">
        <div class="header">
            <div>
                <h2>{{ name }}</h2>
                <p>{{ $t('friend_request.intro') }}</p>
            </div>
            <div>
                <img class="avatar" :src="sharedStateContact.currentFriendRequest._target.portrait">
            </div>
        </div>
        <div class="content">
            <ul>
                <li>
                    <label>{{ $t('common.alias') }}</label>
                    <div class="alias">
                        <input type="text" v-model="friendAlias"
                            @keyup.enter="updateFriendName" :placeholder="$t('common.alias')"/>
                    </div>
                </li>
                <li>
                    <label>{{ $t('common.reason') }}</label>

                    <p v-if="sharedStateContact.currentFriendRequest.reason">{{ sharedStateContact.currentFriendRequest.reason }}</p>
                    <p v-else>{{ $t('friend_request.im') + sharedStateContact.currentFriendRequest._target.displayName }}</p>

                </li>
                <!-- <li>
                    <label>{{ $t('common.label') }}</label>
                    <p>{{ $t('misc.test_user') }}</p>
                </li> -->
            </ul>
        </div>
        <div v-if="isFriend" class="footer">
            <a @click="this.chat">{{ $t('message.send_message') }}</a>
            <a class="delete-friend" @click="deleteFriend">{{ $t('friend_request.deleteFriend') }}</a>
            <!-- <a v-if="isBlackListed" class="delete-friend" @click="changeFriendBlacklist(false)">{{ $t('friend_request.unBlacklistFriend') }}</a> -->
        </div>
    </section>
</template>

<script>
import store from "@/store";
import ConversationType from "@/wfc/model/conversationType";
import Conversation from "@/wfc/model/conversation";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "FriendRequestDetailView",
    props: {},
    data() {
        return {
            sharedStateContact: store.state.contact,
            friendAlias: store.state.contact.currentFriendRequest._target.alias
        }
    },

    methods: {
        chat() {
            let conversation = new Conversation(ConversationType.Single, this.sharedStateContact.currentFriendRequest.target, 0);
            store.setCurrentConversation(conversation);
            this.$router.replace('/home');
        },
        changeFriendBlacklist(status){
            wfc.setBlackList(this.sharedStateContact.currentFriendRequest._target.uid, status, () => {
                this.sharedStateContact.currentFriendRequest = null;
            }, (error) => {
                console.log(error)
            });
        },
        deleteFriend(){
            store.deleteFriend(this.sharedStateContact.currentFriendRequest._target.uid, () => {
                this.sharedStateContact.currentFriendRequest = null;
            }, (error) => {
                console.log(error)
            });
        },
        updateFriendName() {
            // if (this.friendAlias) {
                const friend = this.sharedStateContact.currentFriendRequest._target;
                wfc.setFriendAlias(friend.uid, this.friendAlias,
                    () => {
                        this.friendAliasName(this.friendAlias);
                    },
                    (error) => {
                        console.log("Failure");
                    })
            // }
        },
    },
    computed: {
        name: function () {
            let name;
            let friend = this.sharedStateContact.currentFriendRequest._target;
            if (friend.friendAlias) {
                name = friend.friendAlias;
            } else if (friend.displayName) {
                name = friend.displayName;
            } else {
                name = friend.name;
            }
            return name;
        },
        isFriend() {
            return this.sharedStateContact.currentFriendRequest.target === wfc.getUserId() || wfc.isMyFriend(this.sharedStateContact.currentFriendRequest.target)
        },
        isBlackListed() {
            return wfc.isBlackListed(this.sharedStateContact.currentFriendRequest.target)
        }
    }
}
</script>

<style lang="css" scoped>

.user-detail-container {
    margin-left: 90px;
    margin-right: 90px;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
}

.header {
    margin-top: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid #e6e6e6;
}

.header .avatar {
    width: 80px;
    height: 80px;
    border-radius: 2px;
}

.header h2 {
    font-size: 20px;
    font-style: normal;
    font-weight: normal;
    margin-bottom: 5px;
}

.content {
    width: 100%;
    text-align: left;
}

.content ul {
    list-style: none;
    margin: 20px 0;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
}

.content ul li label {
    margin-right: 20px;
}

.content ul li .alias > input {
    width: 100%;
    border: none;
    height: 20px;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.footer {
    display: flex;
    justify-content: center;
}

.footer a {
    margin-top: 30px;
    color: white;
    padding: 10px 40px;
    background-color: #20fb64;
    border-radius: 5px;
    border: 1px solid transparent;
    cursor: pointer;
}

.footer a:active {
    background-color: red;
}
a.delete-friend{
    margin-left: 2rem;
    background-color: red;
}
</style>
