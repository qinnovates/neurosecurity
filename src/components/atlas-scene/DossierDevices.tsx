import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { DeviceRelation, DossierDevice } from '@/lib/atlas-explorer/dossier-file';
import type { RegionDetail } from '@/lib/atlas-explorer/region-detail';
import LimitNote from './LimitNote';

interface Props {
  detail: RegionDetail;
  onChooseDevice: (deviceId: string) => void;
}

/** Each relation the atlas file states, in plain words. Four kinds: a device in a vessel beside a region is not implanted in it. */
const RELATION_HEADINGS: Readonly<Record<DeviceRelation, string>> = {
  implanted_in: 'Implanted in this region',
  endovascular_adjacent_to: 'Inside a blood vessel beside it',
  scalp_position_over: 'Records from the scalp',
  stimulates_afferent_to: 'Stimulates a sense organ or nerve leading here',
};

const readable = (word: string): string => word.replaceAll(/[_-]/g, ' ');

function DeviceRow({ device, onChooseDevice }: Pick<Props, 'onChooseDevice'> & { device: DossierDevice }) {
  return (
    <li className="atlas-dossier-row" data-dossier-device={device.id}>
      <p className="atlas-fact"><button type="button" className="atlas-link-button" onClick={() => onChooseDevice(device.id)}>{device.name}</button></p>
      <p className="atlas-row-why">Interface: {device.interface_type}. Company: {device.company?.name ?? 'no record'}.</p>
    </li>
  );
}

function Companies({ detail }: Pick<Props, 'detail'>) {
  if ((detail.companies?.length ?? 0) === 0) return null;
  return (
    <>
      <h4 className="atlas-minor-heading">Companies</h4>
      <LimitNote limit={limitSentence('company_is_context')} />
      <ul className="atlas-dossier-rows">
        {detail.companies?.map((company) => (
          <li className="atlas-dossier-row" key={company.name} data-dossier-company={company.name}>
            <p className="atlas-row-why">{company.name}: {readable(company.type)}, {readable(company.status)}.</p>
          </li>
        ))}
      </ul>
    </>
  );
}

/** The devices whose record names the region, by what that record says the region is to them. Null until the dossier's file has arrived. */
export default function DossierDevices({ detail, onChooseDevice }: Props) {
  if (detail.deviceGroups === null) return null;
  return (
    <section className="atlas-section" aria-labelledby="atlas-dossier-devices">
      <h3 className="atlas-subheading" id="atlas-dossier-devices">Devices</h3>
      {detail.deviceGroups.length === 0 ? <LimitNote limit={limitSentence('stated_devices_none')} /> : <LimitNote limit={limitSentence('qif_file_fact')} />}
      {detail.deviceGroups.map(({ relation, devices }) => (
        <div key={relation} data-device-relation={relation}>
          <h4 className="atlas-minor-heading">{RELATION_HEADINGS[relation]}</h4>
          <ul className="atlas-dossier-rows">{devices.map((device) => <DeviceRow key={device.id} device={device} onChooseDevice={onChooseDevice} />)}</ul>
        </div>
      ))}
      <Companies detail={detail} />
    </section>
  );
}
