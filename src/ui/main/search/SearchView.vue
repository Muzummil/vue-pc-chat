<template>
    <div class="search-input-container">
        <input id="searchInput"
               ref="input"
               autocomplete="off"
               v-on:focus="onFocus(true)"
               v-model="sharedSearchState.query"
               @keydown.esc="cancel"
               type="text" :placeholder="$t('common.search')"/>
        <i class="icon-ion-ios-search"></i>
        <button v-if="showAddButton" @click="showCreateConversationModal">+</button>
    </div>
</template>

<script>
import store from "@/store";
import PickAllUserView from "@/ui/main/pick/PickAllUserView";
import PickUserView from "@/ui/main/pick/PickUserView";
import Config from "../../../config";

export default {
    name: "SearchView",
    props: {
        showAddButton: {
            type: Boolean,
            default: true,
        },
        searchType: {
            type: String,
            default: '',
            isAllUserSearch: false
        },
        searchCategory: {
            type: String,
            required: false,
            default: 'normalSearch'
        }
    },
    data() {
        return {
            sharedSearchState: store.state.search,
            sharedContactState: store.state.contact,
            allUsersState: store.state,
        };
    },
    methods: {
        onFocus(focused) {
            store.toggleSearchView(focused);
        },

        showCreateConversationModal() {
            console.log(this.allUsersState)
            let beforeOpen = () => {
                // console.log('Opening...')
            };
            let beforeClose = (event) => {
                // console.log('Closing...', event, event.params)
                // What a gamble... 50% chance to cancel closing
                if (event.params && event.params.confirm) {
                    let users = event.params.users;
                    store.createConversation(users);

                    console.log('confirm')
                } else {
                    console.log('cancel')
                    // TODO clear pick state
                }
            };
            let closed = (event) => {
                console.log('Close...', event)
            };
            let users = this.sharedContactState.favContactList.concat(this.sharedContactState.friendList);
            users = users.filter(u => {
               return u.uid !== Config.FILE_HELPER_ID
            });
            if(this.searchCategory && this.searchCategory == "allUsersSearch"){
                this.$modal.show(
                    PickAllUserView,
                    {
                        users: users,
                        confirmTitle: this.$t('common.create'),
                    }, {
                        name: 'pick-user-modal',
                        width: 600,
                        height: 480,
                        clickToClose: true,
                    }, {
                        'before-open': beforeOpen,
                        'before-close': beforeClose,
                        'closed': closed,
                    })
            }else{
                this.$modal.show(
                    PickUserView,
                    {
                        users: users,
                        confirmTitle: this.$t('common.create'),
                    }, {
                        name: 'pick-user-modal',
                        width: 600,
                        height: 480,
                        clickToClose: false,
                    }, {
                        'before-open': beforeOpen,
                        'before-close': beforeClose,
                        'closed': closed,
                    })
            }
        },
        cancel() {
            store.toggleSearchView(false);
            this.$refs['input'].blur();
        }
    }
}
</script>

<style lang="css" scoped>
.search-input-container {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fafafa;
    -webkit-app-region: drag;
    position: relative;
}

.search-input-container input {
    height: 25px;
    margin-left: 10px;
    margin-right: 10px;
    padding: 0 10px 0 20px;
    text-align: left;
    flex: 1;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    background-color: #eeeeee;
}

.search-input-container input:active {
    border: 1px solid #4168e0;
}

.search-input-container input:focus {
    border: 1px solid #4168e0;
}

.search-input-container i {
    position: absolute;
    left: 15px;
}

.search-input-container button {
    width: 30px;
    height: 25px;
    margin-right: 10px;
    background-color: #fafafa;
    border-radius: 3px;
    border: 1px solid #e5e5e5;
}

.search-input-container button:active {
    background-color: #e5e5e5;
}

</style>
