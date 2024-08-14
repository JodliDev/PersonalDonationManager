import {Class} from "../Class";
import {BaseListEntry} from "../BaseListEntry";
import {ConfirmMessage} from "./ConfirmMessage";
import {BaseListMessage} from "../BaseListMessage";

export class AddMessage extends ConfirmMessage implements BaseListMessage {
	public readonly listName: string
	constructor(
		entryClass: Class<BaseListEntry>,
		public readonly values: Partial<BaseListEntry>
	) {
		super()
		this.listName = entryClass.name
	}
}
