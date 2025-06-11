export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Organism {
  id: number;
  name: string;
}

export interface Vendor {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Cellline {
  id: number;
  user_id: number;
  user_name: string;
  organism_id: number;
  organism_name: string;
  refid: string;
  genotype: string;
  date: string;
  source: string;
  link: string;
  copies: number;
  leftcopies: number;
  parent: string;
  reference: string;
  sequence: string;
  comment: string;
  location: string;
}

export interface Order {
  id: number;
  user_id: number;
  user_name: string;
  vendor_id: number;
  vendor_name: string;
  category_id: number;
  category_name: string;
  catalog: string;
  qty: number;
  desc: string;
  unitprice: number;
  unit: string;
  link: string;
  orderdate: string;
  receiptdate: string;
  comment: string;
  location: string;
}

export interface Oligo {
  id: number;
  user_id: number;
  user_name: string;
  organism_id: number;
  organism_name: string;
  refid: string;
  desc: string;
  seq: string;
  date: string;
  source: string;
  link: string;
  reference: string;
  usefulseq: string;
  comment: string;
  location: string;
  length: number;
  meltingtemp: number;
  gc: number;
}

export interface Plasmid {
  id: number;
  user_id: number;
  user_name: string;
  organism_id: number;
  organism_name: string;
  refid: string;
  genotype: string;
  date: string;
  source: string;
  link: string;
  replicates: number;
  leftover: number;
  parent: string;
  reference: string;
  sequence: string;
  resistance: string;
  temperature: string;
  copynumber: string;
  comment: string;
  location: string;
}

export interface AuthUser {
  username: string;
  name: string;
  avatar_url: string;
  isAdmin: boolean;
  isActiveMember: boolean;
}