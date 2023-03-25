/// <reference types="node" />
import { MessageConstructor } from '../types/Message';
/**
 * NOTE for general questions see
 * http://wiki.ros.org/ROS/TCPROS
 */
export declare function createSubHeader(callerId: string, md5sum: string, topic: string, type: string, messageDefinition: string, tcpNoDelay: boolean): Buffer;
export declare function createPubHeader(callerId: string, md5sum: string, type: string, latching: boolean, messageDefinition: string): Buffer;
export declare function createServiceClientHeader(callerId: string, service: string, md5sum: string, type: string, persistent: boolean): Buffer;
export declare function createServiceServerHeader(callerId: string, md5sum: string, type: string): Buffer;
declare type TcpRosHeader = {
    topic?: string;
    callerId?: string;
    service?: string;
    md5sum?: string;
    type?: string;
    latching?: string;
    persistent?: string;
    tcp_nodelay?: string;
    message_definition?: string;
    [key: string]: any;
};
declare type ValidationResult = Buffer | null;
export declare function parseTcpRosHeader(header: Buffer): TcpRosHeader;
export declare function validateSubHeader(header: TcpRosHeader, topic: string, type: string, md5sum: string): ValidationResult;
export declare function validatePubHeader(header: TcpRosHeader, type: string, md5sum: string): ValidationResult;
export declare function validateServiceClientHeader(header: TcpRosHeader, service: string, md5sum: string): string | null;
export declare function serializeMessage<T>(MessageClass: MessageConstructor<T>, message: T, prependMessageLength?: boolean): Buffer;
export declare function serializeServiceResponse<T>(ResponseClass: MessageConstructor<T>, response: T, success: boolean, prependResponseInfo?: boolean): Buffer;
export declare function deserializeMessage<T>(MessageClass: MessageConstructor<T>, messageBuffer: Buffer): T;
export declare function createTcpRosError(str: string): Buffer;
export {};
