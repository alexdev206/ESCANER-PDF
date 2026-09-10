import { ColumnDefinition, ExtractedRow } from '../types';
import { TEMPLATES, validateAllRows } from '../utils/validation';

export interface SampleDocument {
  id: string;
  title: string;
  category: 'ADULTOS' | 'GESTANTES' | 'MENORES_5';
  badge: string;
  description: string;
  fileName: string;
  columns: ColumnDefinition[];
  sampleRows: ExtractedRow[];
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'sample-adultos',
    title: 'Consolidado de Caracterizaciones Adultos',
    category: 'ADULTOS',
    badge: 'Adultos · Subred Sur',
    description: 'Formato de caracterización comunitaria de adultos en Ciudad Bolívar con 4 registros manuscritos.',
    fileName: 'consolidado_adultos_subred_sur.pdf',
    columns: TEMPLATES.ADULTOS.columns,
    sampleRows: validateAllRows(TEMPLATES.ADULTOS.columns, [
      {
        UPGD: 'USS Benito',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '31/07/26',
        TIPO_ID: 'CC',
        ID: '40200582',
        PRIMER_NOMBRE: 'Ana',
        SEGUNDO_NOMBRE: 'Maria',
        PRIMER_APELLIDO: 'Vargas',
        SEGUNDO_APELLIDO: 'Reyes',
        DIRECCION_RESIDENCIA: 'KR 75F BIS 62 I 33 Sur',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3134401014',
        FECHA_VISITA: '31/08/26',
      },
      {
        UPGD: 'USS Bienestar Meissen',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '31/07/26',
        TIPO_ID: 'CC',
        ID: '51857851',
        PRIMER_NOMBRE: 'Luz',
        SEGUNDO_NOMBRE: 'Stella',
        PRIMER_APELLIDO: 'Hernandez',
        SEGUNDO_APELLIDO: 'Gutierrez',
        DIRECCION_RESIDENCIA: 'CL 60 A 27 Sur',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3138973209',
        FECHA_VISITA: '31/08/26',
      },
      {
        UPGD: 'USS Candelaria la Nueva',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '17/07/26',
        TIPO_ID: 'CC',
        ID: '20923788',
        PRIMER_NOMBRE: 'Maria',
        SEGUNDO_NOMBRE: 'Stella',
        PRIMER_APELLIDO: 'Cortes',
        SEGUNDO_APELLIDO: 'Vanegas',
        DIRECCION_RESIDENCIA: 'KR 49 57 A 19 Sur',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3138882421',
        FECHA_VISITA: '31/08/26',
      },
      {
        UPGD: 'USS Bienestar Meissen',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '31/07/26',
        TIPO_ID: 'CC',
        ID: '28892466',
        PRIMER_NOMBRE: 'Elizabeth',
        SEGUNDO_NOMBRE: '',
        PRIMER_APELLIDO: 'Benitez',
        SEGUNDO_APELLIDO: 'Sanabria',
        DIRECCION_RESIDENCIA: 'KR 45 POSTE 18 31 Sur',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3132804709',
        FECHA_VISITA: '31/08/26',
      }
    ])
  },
  {
    id: 'sample-gestantes',
    title: 'Consolidado de Caracterizaciones Gestantes',
    category: 'GESTANTES',
    badge: 'Gestantes · Subred Sur',
    description: 'Formato de seguimiento a gestantes con controles, semanas de gestación y fecha de última menstruación.',
    fileName: 'consolidado_gestantes_subred_sur.pdf',
    columns: TEMPLATES.GESTANTES.columns,
    sampleRows: validateAllRows(TEMPLATES.GESTANTES.columns, [
      {
        UPGD: 'Unidad Servisalud Manuela Beltran I',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '03-07-26',
        TIPO_ID: 'CC',
        ID: '1002391894',
        PRIMER_NOMBRE: 'Aslly',
        SEGUNDO_NOMBRE: 'Nayibe',
        PRIMER_APELLIDO: 'Aragon',
        SEGUNDO_APELLIDO: 'Perea',
        DIRECCION_RESIDENCIA: 'TV 36A 79 73 Sur',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3123745575',
        FECHA_VISITA: '11-08-26',
        SEMANAS_GESTACION: '28',
        NUM_CONTROLES: '4',
        FUM: '15/12/25'
      },
      {
        UPGD: 'Unidad Servisalud Manuela Beltran I',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '14-07-26',
        TIPO_ID: 'CC',
        ID: '1075413584',
        PRIMER_NOMBRE: 'Maria',
        SEGUNDO_NOMBRE: 'Fernanda',
        PRIMER_APELLIDO: 'Patiño',
        SEGUNDO_APELLIDO: 'Duran',
        DIRECCION_RESIDENCIA: 'TV 48A 69C 05 Sur',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3214570082',
        FECHA_VISITA: '11-08-26',
        SEMANAS_GESTACION: '32',
        NUM_CONTROLES: '5',
        FUM: '20/11/25'
      },
      {
        UPGD: 'Unidad Ejecutora de Salud Vista Hermosa',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '08-07-26',
        TIPO_ID: 'CC',
        ID: '1111234638',
        PRIMER_NOMBRE: 'Jelly',
        SEGUNDO_NOMBRE: 'Lorena',
        PRIMER_APELLIDO: 'Quiroga',
        SEGUNDO_APELLIDO: 'Cuellar',
        DIRECCION_RESIDENCIA: 'KR 27D 71D 28 Sur',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3224284938',
        FECHA_VISITA: '11-08-26',
        SEMANAS_GESTACION: '18',
        NUM_CONTROLES: '2',
        FUM: '05/03/26'
      },
      {
        UPGD: 'Unidad Ejecutora de Salud Vista Hermosa',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '05-07-26',
        TIPO_ID: 'DE',
        ID: 'VEA3058921',
        PRIMER_NOMBRE: 'Genesis',
        SEGUNDO_NOMBRE: 'Yonkalis',
        PRIMER_APELLIDO: 'Aguilar',
        SEGUNDO_APELLIDO: 'Carvajal',
        DIRECCION_RESIDENCIA: 'DG 61 C BIS Sur 70C-12',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3017364203',
        FECHA_VISITA: '11-08-26',
        SEMANAS_GESTACION: '36',
        NUM_CONTROLES: '6',
        FUM: '28/10/25'
      }
    ])
  },
  {
    id: 'sample-menores5',
    title: 'Consolidado Menores de 5 Años',
    category: 'MENORES_5',
    badge: 'Primera Infancia · Subred Sur',
    description: 'Formato de menores con datos del menor de edad y del cuidador o receptor de la visita domiciliaria.',
    fileName: 'consolidado_menores5_subred_sur.pdf',
    columns: TEMPLATES.MENORES_5.columns,
    sampleRows: validateAllRows(TEMPLATES.MENORES_5.columns, [
      {
        UPGD: 'USS Meissen',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '15-07-26',
        TIPO_ID: 'RC',
        ID: '1124641968',
        PRIMER_NOMBRE: 'Ashley',
        SEGUNDO_NOMBRE: 'Isabella',
        PRIMER_APELLIDO: 'Ropave',
        SEGUNDO_APELLIDO: 'Cadavid',
        DIRECCION_RESIDENCIA: 'KR 27 J 71 H 09',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3204340734',
        FECHA_VISITA: '11-08-26',
        NOMBRE_QUIEN_RECIBE: 'Aleyda Cadavid',
        TIPO_ID_RECEPTOR: 'CC',
        ID_RECEPTOR: '1006030562'
      },
      {
        UPGD: 'USS Meissen',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '16-07-26',
        TIPO_ID: 'RC',
        ID: '1124508084',
        PRIMER_NOMBRE: 'Jesus',
        SEGUNDO_NOMBRE: 'Camilo',
        PRIMER_APELLIDO: 'Forrero',
        SEGUNDO_APELLIDO: 'Ariza',
        DIRECCION_RESIDENCIA: 'CL 74S 27 H 09',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3209723560',
        FECHA_VISITA: '11-08-26',
        NOMBRE_QUIEN_RECIBE: 'Anyie Nollava',
        TIPO_ID_RECEPTOR: 'CC',
        ID_RECEPTOR: '1193208587'
      },
      {
        UPGD: 'USS Meissen',
        SUBRED: 'Sur',
        FECHA_CONSULTA: '12-07-26',
        TIPO_ID: 'RC',
        ID: '1124649683',
        PRIMER_NOMBRE: 'Adhara',
        SEGUNDO_NOMBRE: 'Luciana',
        PRIMER_APELLIDO: 'Maracaya',
        SEGUNDO_APELLIDO: 'Velasquez',
        DIRECCION_RESIDENCIA: 'KR 73 63 A 21 Sur',
        LOCALIDAD_RESIDENCIA: 'Ciudad Bolívar',
        TELEFONO: '3503149165',
        FECHA_VISITA: '11-08-26',
        NOMBRE_QUIEN_RECIBE: 'Yanire Velasquez Gonzalez',
        TIPO_ID_RECEPTOR: 'PPT',
        ID_RECEPTOR: '57315533'
      }
    ])
  }
];
