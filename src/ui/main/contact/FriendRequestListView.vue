<template>
    <section>
        <ul>
            <li v-for="(friendRequest,index) in sharedContactState.friendRequestList" :key="index"
                @click="showFriendRequest(friendRequest)">
                <div class="new-friend-item-container"
                     v-bind:class="{active :sharedContactState.currentFriendRequest && sharedContactState.currentFriendRequest.target === friendRequest.target}">
                    <div class="new-friend-item">
                        <img class="avatar" :src="friendRequest._target.portrait">
                        <div class="info">
                            <div class="info-container">
                                <!-- Start User details part -->
                                <div class="user-info-container">

                                    <div class="username user-info-text">{{ friendRequest._target.displayName }}</div>

                                    <div class="req-reason user-info-text">
                                        <span v-if="friendRequest.reason" class="reason">{{ friendRequest.reason }}</span>

                                        <span v-else class="reason">{{ $t('friend_request.im') + friendRequest._target.displayName }}</span>
                                    </div>
                                </div>
                                <!-- End User details part -->

                                <!-- Start User action -->
                                <div v-if="friendRequest.status === 0" class="user-action-container">
                                    <div class="accept-btn">
                                        <button class="action-btn"
                                            @click="accept(friendRequest)">{{ $t('common.add') }}
                                        </button>
                                    </div>
                                    <div class="reject-btn">
                                        <button class="action-btn reject"
                                            @click="reject(friendRequest)">{{ $t('common.reject') }}
                                        </button>
                                    </div>
                                </div>
                                <!-- End User action part -->
                                
                                <!-- Start req feedback -->

                                <div v-else class="req-feedback name-action username">
                                    <span v-if="friendRequest.status === 3" class="status">{{
                                            $t('friend_request.denied')
                                        }}</span>
                                    <span v-if="friendRequest.status === 1" class="status">{{
                                            $t('friend_request.accepted')
                                        }}</span>
                                </div>
                                <!-- End req feedback -->
                            </div>
                            


                            <!-- <div class="name-action">

                                <span v-if="friendRequest.reason" class="reason single-line width">{{ friendRequest.reason }}</span>

                                <span v-else class="reason single-line width">{{ $t('friend_request.im') + friendRequest._target.displayName }}</span>

                                <button v-if="friendRequest.status === 0" class="accept reject"
                                        @click="reject(friendRequest)">{{
                                        $t('common.reject')
                                    }}
                                </button>
                                
                            </div> -->

                            <!-- <span v-if="friendRequest.status === 1" class="status">{{
                                        $t('friend_request.accepted')
                                    }}</span>

                                    <span
                                    v-else-if="friendRequest.status === 3" class="status">{{
                                        $t('friend_request.denied')
                                    }}</span> -->

                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "@/store";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "NewFriendListView",
    props: {
        newFriends: null,
    },
    data() {
        return {
            sharedContactState: store.state.contact,
        };
    },
    methods: {
        showFriendRequest(friendRequest) {
            store.setCurrentFriendRequest(friendRequest);
        },
        accept(friendRequest) {
            wfc.handleFriendRequest(friendRequest.target, true, "", () => {
                friendRequest.status = 1;
            }, (err) => {
                console.log('accept friend request error', err)
            })
        },
        reject(friendRequest) {
            wfc.handleFriendRequest(friendRequest.target, false, "", () => {
                friendRequest.status = 3;
            }, (err) => {
                console.log('reject friend request error', err)
            })
        }
    }
}
</script>

<style lang="css" scoped>
.new-friend-item-container {
    padding-left: 30px;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.new-friend-item {
    display: flex;
    width: 100%;
    padding: 10px 15px 10px 0;
    align-items: center;
    font-size: 13px;
    border-bottom: 1px solid #e0e0e0;
}


.new-friend-item-container.active {
    background-color: #d6d6d6;
}

.new-friend-item-container:hover {
    background-color: #d6d6d6;
}

.new-friend-item .info {
    margin-left: 10px;
    flex: 1;
}

 .name {
    flex: 1;
}

.action-btn {
    padding: 0 10px;
    text-align: center;
    color: white;
    background: #4168e0;
    border-radius: 10px;
}

.status {
    color: #b2b2b2;
}

.new-friend-item .info .reason {
    font-size: 12px;
    color: #b2b2b2;
}
.name-action.username{
    margin-bottom: 5px;
}
.user-info-container, .user-action-container{
    line-height: 1.4rem;
}
.user-info-container{
    width: 77px;
}
.user-info-text{
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    width: 76px;
}
.action-btn.reject{
    background: #bf4d4d !important;
}
.info-container{
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
