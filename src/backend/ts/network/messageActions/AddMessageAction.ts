import {BaseBackendMessageAction} from "../BaseBackendMessageAction";
import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {BaseListEntry} from "../../../../shared/BaseListEntry";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {AddMessage} from "../../../../shared/messages/AddMessage";
import {TableDefinition} from "../../database/TableDefinition";
import {AuthorisedMessageAction} from "../AuthorisedMessageAction";
import {Convenience} from "../../Convenience";
import {ListMessageAction} from "./ListMessageAction";
import {ListEntryResponseMessage} from "../../../../shared/messages/ListEntryResponseMessage";

export class AddMessageAction extends AuthorisedMessageAction<AddMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicObj = await ListMessageAction.getPublicListObj(this.data)
		const obj = await ListMessageAction.getListObj(this.data, publicObj)
		const tableName = publicObj.getTableName()
		
		ListMessageAction.checkValues(this.data.values, publicObj)
		
		const settings = obj.getSettings && obj.getSettings()
		settings?.onAdd && settings?.onAdd(this.data.values, db, session.userId!)
		
		const response = db.unsafeInsert(tableName, this.data.values)
		
		const entry = db.unsafeSelect(tableName, Object.keys(publicObj), `${publicObj.getPrimaryKey().toString()} = ${response}`, 1)
		session.send(new ListEntryResponseMessage<BaseListEntry>(this.data, response != 0 && entry.length != 0, entry[0] as BaseListEntry))
		
	}
	
}
