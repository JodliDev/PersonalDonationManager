import {WebSocketSession} from "../WebSocketSession";
import {DatabaseManager} from "../../database/DatabaseManager";
import {column} from "../../database/column";
import {LoggedInMessageAction} from "../LoggedInMessageAction";
import {AddToWaitingMessage} from "../../../../shared/messages/AddToWaitingMessage";
import {ConfirmResponseMessage} from "../../../../shared/messages/ConfirmResponseMessage";
import {Budget} from "../../database/dataClasses/Budget";
import {Waiting} from "../../database/dataClasses/Waiting";

// noinspection JSUnusedGlobalSymbols
export class AddToWaitingMessageAction extends LoggedInMessageAction<AddToWaitingMessage> {
	
	async authorizedExec(session: WebSocketSession, db: DatabaseManager): Promise<void> {
		const [spendingEntry] = db.selectTable(
			Budget, 
			`${column(Budget, "userId")} = ${session.userId} AND ${column(Budget, "budgetId")} = ${this.data.spendingEntryId}`,
			1
		)
		if(!spendingEntry) {
			session.send(new ConfirmResponseMessage(this.data, false))
			return
		}
		
		AddToWaitingMessageAction.createEntry(db, session.userId!, spendingEntry)
		session.send(new ConfirmResponseMessage(this.data, true))
	}
	
	public static createEntry(db: DatabaseManager, userId: number | bigint, possibleSpendingEntry: Budget) {
		db.insert(Waiting, {
			userId: userId,
			addedAt: Date.now(),
			budgetId: possibleSpendingEntry.budgetId,
		})
		
	}
}
