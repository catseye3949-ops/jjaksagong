type NicepayRequestPayParams = {
  clientId: string;
  method: string;
  orderId: string;
  amount: number;
  goodsName: string;
  returnUrl: string;
  mallReserved?: string;
  mallUserId?: string;
  buyerName?: string;
  buyerEmail?: string;
  language?: "KO" | "EN" | "CN";
  fnError?: (error: { errorMsg?: string; errorCode?: string }) => void;
};

interface Window {
  AUTHNICE?: {
    requestPay(params: NicepayRequestPayParams): void;
  };
}
