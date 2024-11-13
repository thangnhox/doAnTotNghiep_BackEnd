export default interface APIResponse<T> {
    Message: string;
    Data: Array<T>;
    Total: number;
    Page: number;
    PageSize: number;
}