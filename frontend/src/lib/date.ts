// 取得今天日期（YYYY-MM-DD）
export function getToday(): string {
	return formatDate(new Date());
}

// 格式化日期為 YYYY-MM-DD
export function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// 解析日期字串
export function parseDate(dateStr: string): Date {
	const [year, month, day] = dateStr.split("-").map(Number);
	return new Date(year, month - 1, day);
}

// 加減天數
export function addDays(dateStr: string, days: number): string {
	const date = parseDate(dateStr);
	date.setDate(date.getDate() + days);
	return formatDate(date);
}

// 取得週一（週的開始）
export function getWeekStart(dateStr: string): string {
	const date = parseDate(dateStr);
	const day = date.getDay();
	const diff = date.getDate() - day + (day === 0 ? -6 : 1);
	date.setDate(diff);
	return formatDate(date);
}

// 取得週日（週的結束）
export function getWeekEnd(dateStr: string): string {
	const start = getWeekStart(dateStr);
	return addDays(start, 6);
}

// 格式化日期顯示（台灣格式）
export function formatDisplayDate(dateStr: string): string {
	const date = parseDate(dateStr);
	return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 格式化週範圍
export function formatWeekRange(startDate: string, endDate: string): string {
	return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
}

// 取得星期幾（中文）
export function getWeekdayName(dateStr: string): string {
	const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
	const date = parseDate(dateStr);
	return weekdays[date.getDay()];
}

// 判斷是否為今天
export function isToday(dateStr: string): boolean {
	return dateStr === getToday();
}
