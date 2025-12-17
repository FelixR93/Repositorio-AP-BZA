export type DeviceType = 'MOVIL' | 'LAPTOP' | 'PC';
export type AreaType = 'CONTROL' | 'SEGURIDAD' | 'MONITOREO';

export interface Device {
  _id?: string;

  apName: string;
  ownerName: string;
  mac: string;
  deviceType: DeviceType;

  area: AreaType;
  locationPoint: string;

  brand?: string;
  model?: string;
  serial?: string;
  hostname?: string;
  notes?: string;

  // ✅ Para mostrar quién registró
  registeredByName?: string;
  registeredBy?: any;

  // ✅ Auditoría
  createdAt?: string;
  updatedAt?: string;
}
