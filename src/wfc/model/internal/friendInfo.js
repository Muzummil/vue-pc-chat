/*
 * Copyright (c) 2021 Panda DB Chat. All rights reserved.
 */

export default class FriendInfo {
    uid = '';
    updateDt = 0;
    state = 0; // 0, 正常；1，无关系；2 黑名单
    alias = '';
    blacked = 0;
    extra = '';
}
