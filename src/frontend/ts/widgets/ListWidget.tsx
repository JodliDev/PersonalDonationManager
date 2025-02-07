import { PagesHelper } from "./PagesHelper";
import { BtnWidget } from "./BtnWidget";
import { Lang } from "../../../shared/Lang";
import { LoadingSpinner } from "./LoadingSpinner";
import "./ListWidget.css"
import {BasePublicTable} from "../../../shared/BasePublicTable";
import {Class} from "../../../shared/Class";
import {Site} from "../views/Site";
import {ListMessage} from "../../../shared/messages/ListMessage";
import {ListResponseEntry, ListResponseMessage} from "../../../shared/messages/ListResponseMessage";
import {DeleteMessage} from "../../../shared/messages/DeleteMessage";
import {AddMessage} from "../../../shared/messages/AddMessage";
import {closeDropdown, DropdownMenu} from "./DropdownMenu";
import m, {Component, Vnode, VnodeDOM} from "mithril";
import {EditMessage} from "../../../shared/messages/EditMessage";
import {ListEntryResponseMessage} from "../../../shared/messages/ListEntryResponseMessage";
import {BindValueToInput} from "./BindValueToInput";
import {ListEntryEditComponent} from "./ListEntryEditWidget";

const PAGE_SIZE = 25;



export class ListWidgetCallback {
	reload: () => Promise<void> = () => Promise.resolve()
	isEmpty: () => boolean = () => true
}

interface ListComponentOptions<EntryT extends BasePublicTable> {
	site: Site
	tableClass: Class<EntryT>
	title: string,
	getEntryView: (entry: ListResponseEntry<EntryT>) => Vnode,
	hideRefresh?: boolean
	deleteOptions?: { onDeleted?: () => void },
	addOptions?: {
		columns: (keyof EntryT)[],
		onAdded?: () => void,
		customInputView?: (key: keyof EntryT, value: EntryT[keyof EntryT], setValue: (value: EntryT[keyof EntryT]) => void) => Vnode<any, any> | undefined,
		getValueError?: (key: keyof EntryT, value: unknown) => string | undefined
	}
	editOptions?: {
		columns: (keyof EntryT)[],
		onChanged?: () => void,
		customInputView?: (key: keyof EntryT, value: EntryT[keyof EntryT], setValue: (value: EntryT[keyof EntryT]) => void) => Vnode<any, any> | undefined,
		getValueError?: (key: keyof EntryT, value: unknown) => string | undefined
	},
	customOptions?: Vnode<any, unknown>
	pageSize?: number
	order?: keyof EntryT
	orderType?: "ASC" | "DESC"
	callback?: ListWidgetCallback
}

class ListComponent<EntryT extends BasePublicTable> implements Component<ListComponentOptions<EntryT>, unknown> {
	private items: ListResponseEntry<EntryT>[] = []
	private pagesHelper: PagesHelper = new PagesHelper(PAGE_SIZE, this.loadPage.bind(this))
	private idColumn?: keyof EntryT
	private isLoading: boolean = false
	private options?: ListComponentOptions<EntryT>
	
	
	private async loadPage(pageNumber: number = this.pagesHelper.getCurrentPage()): Promise<void> {
		const options = this.options!
		this.isLoading = true
		m.redraw()
		
		const pageSize = PAGE_SIZE
		const response = await this.options!.site.socket.sendAndReceive(
			new ListMessage(options.tableClass, pageNumber * pageSize, pageSize, options.order ? options.order.toString() : undefined, options.orderType)
		)
		const listMessage = response as ListResponseMessage<EntryT>
		if(!listMessage.success) {
			this.options!.site.errorManager.error(Lang.get("errorList"))
			return
		}
		
		this.items = listMessage.list
		this.pagesHelper.setTotalCount(listMessage.totalCount)
		this.idColumn = listMessage.idColumn as keyof EntryT
		this.isLoading = false
		m.redraw()
	}
	
	private needsReset(oldOptions: ListComponentOptions<EntryT>, newOptions: ListComponentOptions<EntryT>): boolean {
		return oldOptions.tableClass != newOptions.tableClass || oldOptions.order != newOptions.order || oldOptions.orderType != newOptions.orderType
	}
	
	private getId(entry: EntryT): number {
		const idColumn = this.idColumn
		if(!idColumn)
			return -1
		
		return entry[idColumn] as number
	}
	
	private async deleteItem(entry: EntryT) {
		if(!confirm(Lang.get("confirmDelete")))
			return
		const id = this.getId(entry)
		const response = await this.options!.site.socket.sendAndReceive(
			new DeleteMessage(this.options!.tableClass, id as number)
		)
		
		if(response.success) {
			this.items = this.items.filter((r) => this.getId(r.item) != id)
			this.options?.deleteOptions?.onDeleted && this.options?.deleteOptions?.onDeleted()
			m.redraw()
		}
		else
			this.options!.site.errorManager.error(Lang.get("errorDelete"))
	}
	
	private async addItem(newData: ListResponseEntry<EntryT>) {
		const options = this.options!
		
		this.items.push(newData)
		options.addOptions?.onAdded && options.addOptions?.onAdded()
		closeDropdown(`Add~${BasePublicTable.getName(options.tableClass)}`)
		m.redraw()
	}
	
	private async editItem(id: number | bigint, newData: ListResponseEntry<EntryT>) {
		const options = this.options!
		
		const index = this.items.findIndex(entry => this.getId(entry.item) == id)
		this.items[index] = newData
		options.editOptions?.onChanged && options.editOptions?.onChanged()
		closeDropdown(`Edit~${BasePublicTable.getName(options.tableClass)}`)
		m.redraw()
	}
	
	private setOptions(vNode: Vnode<ListComponentOptions<EntryT>, unknown>): void {
		this.options = vNode.attrs
		if(this.options.callback) {
			this.options.callback.reload = this.loadPage.bind(this)
			this.options.callback.isEmpty = this.pagesHelper.isEmpty.bind(this.pagesHelper)
		}
	}
	
	public async oncreate(vNode: Vnode<ListComponentOptions<EntryT>, unknown>): Promise<void> {
		this.setOptions(vNode)
		await this.loadPage()
	}
	public onbeforeupdate(newNode: Vnode<ListComponentOptions<EntryT>, unknown>, oldNode: VnodeDOM<ListComponentOptions<EntryT>, unknown>): void {
		this.setOptions(newNode)
		if(this.needsReset(oldNode.attrs, newNode.attrs)) {
			this.pagesHelper.reset()
			this.items = []
			this.loadPage()
		}
	}
	
	view(vNode: Vnode<ListComponentOptions<EntryT>, unknown>): Vnode {
		const options = vNode.attrs
		return <div class="listWidget surface vertical">
			<h3 class="header horizontal hAlignCenter vAlignCenter">
				<b class="fillSpace horizontal hAlignCenter">{ options.title }</b>
					{ this.isLoading
						? LoadingSpinner(this.isLoading)
						: (options.hideRefresh ? "" : BtnWidget.DefaultBtn("reload", this.loadPage.bind(this, this.pagesHelper.getCurrentPage())))
					}
				{ options.addOptions &&
					DropdownMenu(
						`Add~${BasePublicTable.getName(options.tableClass)}`,
						BtnWidget.PopoverBtn("add", Lang.get("addEntry")),
						() => m(ListEntryEditComponent<EntryT>, {
							mode: "add",
							site: options.site,
							tableClass: options.tableClass,
							columns: options.addOptions!.columns,
							onFinish: this.addItem.bind(this),
							customInputView: options.addOptions!.customInputView,
							getValueError: options.addOptions!.getValueError
						})
					)
				}
				{ options.customOptions && options.customOptions }
			</h3>
			<div class={ `${this.isLoading ? "opacity" : ""} fillSpace subSurface vertical hAlignStretched textCentered` }>
				{ this.pagesHelper.isEmpty()
					? Lang.get("noEntries")
					: this.items.map((entry) => {
						const id = this.getId(entry.item)
						return <div class="horizontal entry vAlignCenter">
							{ options.getEntryView(entry) }
							{ options.editOptions &&
								DropdownMenu(
									`Edit~${BasePublicTable.getName(options.tableClass)}`,
									BtnWidget.PopoverBtn("edit", Lang.get("changeEntryInfo")),
									() => m(ListEntryEditComponent<EntryT>, {
										mode: "edit",
										site: options.site,
										editId: id,
										tableClass: options.tableClass,
										columns: options.editOptions!.columns,
										onFinish: this.editItem.bind(this, id),
										customInputView: options.editOptions!.customInputView,
										getValueError: options.editOptions!.getValueError,
										defaults: entry.item
									})
								)
							
							}
							{ options.deleteOptions && BtnWidget.PopoverBtn("delete", Lang.get("deleteEntryInfo"), () => this.deleteItem(entry.item)) }
						</div>
					})
				}
			</div>
			{ this.pagesHelper.isNeeded() && this.pagesHelper.getView() }
		</div>
	}
}


export function ListWidget<EntryT extends BasePublicTable>(options: ListComponentOptions<EntryT>): Vnode<ListComponentOptions<EntryT>, unknown> {
	return m(ListComponent<EntryT>, options)
}
