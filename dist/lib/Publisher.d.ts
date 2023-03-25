/// <reference path="../../types.d.ts" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import Ultron = require('ultron');
import type PublisherImpl from './impl/PublisherImpl';
/**
 * @class Publisher
 * Public facing publishers class. Allows users to send messages to subscribers
 * on a given topic.
 */
export default class Publisher<M> extends EventEmitter {
    _impl: PublisherImpl<M>;
    _topic: string;
    _type: string;
    _ultron: Ultron;
    constructor(impl: PublisherImpl<M>);
    /**
     * Get the topic this publisher is publishing on
     * @returns {string}
     */
    getTopic(): string;
    /**
     * Get the type of message this publisher is sending
     *            (e.g. std_msgs/String)
     * @returns {string}
     */
    getType(): string;
    /**
     * Check if this publisher is latching
     * @returns {boolean}
     */
    getLatching(): boolean;
    /**
     * Get the numbber of subscribers currently connected to this publisher
     * @returns {number}
     */
    getNumSubscribers(): number;
    /**
     * Shuts down this publisher. If this is the last publisher on this topic
     * for this node, closes the publisher and unregisters the topic from Master
     * @returns {Promise}
     */
    shutdown(): Promise<void>;
    /**
     * Check if this publisher has been shutdown
     * @returns {boolean}
     */
    isShutdown(): boolean;
    /**
     * Schedule the msg for publishing - or publish immediately if we're
     * supposed to
     * @param msg {object} object type matching this._type
     * @param [throttleMs] {number} optional override for publisher setting
     */
    publish(msg: M, throttleMs?: number): void;
}