export interface Indicator {
  id: string;
  name: string;
  providerName: string;
  technicalName: string;
  technicalType: string;
  type: string;
}

export interface InContextIndicator<TValue = unknown> extends Indicator {
  value: TValue;
}

export interface Entity {
  id: string;
  name: string;
  type?: string[];
  sector?: string;
  country?: string;
  investingPortfolioCount?: number;
  totalMarketValue?: number;
  lastValueDate?: string;
  indicators?: InContextIndicator[];
  linkedLists?: { id: string; name: string }[];
  linkedListsCount?: number;
}
