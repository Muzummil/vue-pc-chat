/*
 * Copyright (c) 2021 Panda DB Chat. All rights reserved.
 */

export default class ChannelInfo {
    channelId;
    name;
    portrait;
    desc;
    owner;
    // 0, public; 1, private; 2, destoryed
    status;
    extra;
    updateDt;
}