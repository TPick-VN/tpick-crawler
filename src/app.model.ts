export interface IShop {
  name?: string;
  imageUrl?: string;
  address?: string;
  sections: ISection[];
}

export interface ISection {
  name?: string;
  items: IItem[];
}

export interface IItem {
  name?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  isAvailable?: boolean;
}
