import {WebSocketSession} from "./WebSocketSession";
import {DatabaseManager} from "../database/DatabaseManager";
import {BaseMessage} from "../../../shared/BaseMessage";

export abstract class BaseBackendMessageAction<T extends BaseMessage> {
	public abstract exec(session: WebSocketSession, db: DatabaseManager): Promise<void>
	
	constructor(protected data: T) { }
}
