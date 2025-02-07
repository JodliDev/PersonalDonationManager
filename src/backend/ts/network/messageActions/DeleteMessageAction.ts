import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {DeleteMessage} from "../../../../shared/messages/DeleteMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {ListMessageAction} from "./ListMessageAction";
import {TableSettings} from "../../database/TableSettings";
import {BasePublicTable} from "../../../../shared/BasePublicTable";

// noinspection JSUnusedGlobalSymbols
export class DeleteMessageAction extends LoggedInMessageAction<DeleteMessage> {
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const publicTableClass = await ListMessageAction.getPublicTableClassFromMessage(this.data)
		const publicObj = new publicTableClass
		const tableClass = await ListMessageAction.getTableClass(publicTableClass)
		const obj = new tableClass
		
		const settings = obj.getSettings() as TableSettings<BasePublicTable>
		const where = `${publicObj.getPrimaryKey().toString()} = ${this.data.id}`
		
		settings?.onBeforeDelete(this.data.id, db, session)
		const response = db.delete(tableClass, settings?.getWhere(session, where) ?? where, 1)
		settings?.onAfterDelete(this.data.id, db, session)
		
		session.send(new ConfirmResponseMessage(this.data, response == 1))
	}
}
