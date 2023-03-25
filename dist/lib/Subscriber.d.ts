/// <reference path="../../types.d.ts" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import type SubscriberImpl from './impl/SubscriberImpl';
import { Message } from '../types/Message';
/**
 * @class Subscriber
 * Public facing subscriber class. Allows users to listen to messages from
 * publishers on a given topic.
 */
export default class Subscriber<M extends Message> extends EventEmitter {
    private _impl;
    private _topic;
    private _type;
    private _ultron;
    constructor(impl: SubscriberImpl<M>);
    getTopic(): string;
    getType(): string;
    getNumPublishers(): number;
    shutdown(): Promise<void>;
    isShutdown(): boolean;
}
