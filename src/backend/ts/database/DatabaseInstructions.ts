import {DonationEntry} from "./dataClasses/DonationEntry";
import {WaitingEntry} from "./dataClasses/WaitingEntry";
import {User} from "./dataClasses/User";
import {Class} from "../../../shared/Class";
import {LoginSession} from "./dataClasses/LoginSession";
import {BasePublicTable} from "../../../shared/BasePublicTable";
import BetterSqlite3 from "better-sqlite3";

export class DatabaseInstructions {
	public version: number = 1
	
	public tables: Class<BasePublicTable>[] = [
		DonationEntry,
		LoginSession,
		User,
		WaitingEntry
	]
	
	public preMigration(db: BetterSqlite3.Database, fromVersion: number, toVersion: number): Record<number, unknown> {
		const output: Record<number, unknown> = {}
		
		//do something
		
		return output
	}
	public postMigration(db: BetterSqlite3.Database, fromVersion: number, toVersion: number, preData: Record<number, unknown>): void {
	
	}
	
	
}
