export type BankDetailsItem = {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  currency: string;
  accountCode: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type BankDetailsResponse = {
  message: string;
  data: BankDetailsItem;
};

export type UpdateBankDetailsPayload = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  currency: string;
  accountCode: string;
};
