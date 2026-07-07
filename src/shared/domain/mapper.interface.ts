export interface Mapper<TDomain, TOrm> {
  toDomain(orm: TOrm): TDomain;
  toOrm(domain: TDomain): TOrm;
}
