/*
 * Copyright (c) 2021 Panda DB Chat. All rights reserved.
 */

export default class FriendRequest {
    direction;
    target;
    reason;
    extra;
    //    RequestStatus_Sent = 0,
    //    RequestStatus_Accepted = 1,
    //    RequestStatus_Rejected = 3
    status;
    readStatus;
    timestamp;
}
