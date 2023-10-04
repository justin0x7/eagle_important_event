import SouthIcon from '@mui/icons-material/South';
import { Checkbox, FormLabel } from "@mui/material";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Grid from '@mui/material/Grid';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import eagle from "../assets/eagle.png";
import footerLogo from "../assets/footerLogo.png";
import leafImage from "../assets/pageLogo.png";
import { fetchAPI } from "../core/api/fetch-api";
import { ButtonPrimary } from "../core/components/Button";
import { useAppSelector } from '../core/hooks/rtkHooks';
import { useImportantEventsData } from '../core/hooks/useImportantData';
import { FormDataMap, ImportantEventsBasicData, ImportantEventsData } from "../core/model/importantEvents.model";

export default function ImportantEventsPage() {

  const { t } = useTranslation();

  const [codeNumber, setCodeNumber] = useState("");
  const [formData, setFormData] = useState<FormDataMap | undefined>();
  const [unfilledEntityNames, setUnfilledEntityNames] = useState<Array<string>>([]);

  const {
    loadingImportantEventsBasicData,
    importantEventsBasicData,
    importantEventsFormMetadata
  } = useAppSelector((state) => state.importantEvents);
  const { data: importantEventsData } = useImportantEventsData(codeNumber);
  const todayStr = dayjs().format("YYYY-MM-DD");

  // get codeNumber from encoded url parameter
  useEffect(() => {
    try {
      const decodedParamObject = JSON.parse(atob(atob(atob(window.location.pathname.substring(1)))));
      const urlCodeNumber = decodedParamObject.codeNumber;
      setCodeNumber(urlCodeNumber);
    }
    catch (e) {
      console.log(e);
    }
  }, []);

  // set form data
  useEffect(() => {
    if (!loadingImportantEventsBasicData && !!importantEventsBasicData) {
      const mappedData: FormDataMap = {};
      Object.keys(importantEventsBasicData).forEach((entityPluralName) => {
        const entityName = entityPluralName.replace("Entities", "");
        mappedData[entityName] = {};
        const basicDataUnits = importantEventsBasicData[entityPluralName as keyof ImportantEventsBasicData];
        basicDataUnits.forEach((basicDataUnit) => {
          const nId = basicDataUnit.id;
          const booleanValue = importantEventsData?.formDataByEntityName[entityName].includes(nId) || false;
          mappedData[entityName][nId.toString()] = booleanValue;
        });
      });

      setFormData(mappedData);
    }
  }, [loadingImportantEventsBasicData, importantEventsBasicData, codeNumber, importantEventsData]);

  const handleChangeCheckbox = (entityName: string, idString: string, metaData: any) => {
    if (!formData) return;

    setFormData({
      ...formData,
      [entityName]: {
        ...formData[entityName],
        [idString]: !formData[entityName][idString]
      }
    });
  };

  const handleSave = async () => {
    if (formData) {
      try {
        const importantEventsData = {} as ImportantEventsData;
        importantEventsData.codeNumber = codeNumber as string;
        importantEventsData.formDataByEntityName = {};

        let hasValue = false;
        let unfilledEntities: string[] = [];
        Object.keys(importantEventsBasicData).forEach((entityPluralName) => {
          const entityName = entityPluralName.replace("Entities", "");
          importantEventsData.formDataByEntityName[entityName] = [];
          for (const idString in formData[entityName]) {
            if (formData[entityName][idString]) {
              hasValue = true;
              importantEventsData.formDataByEntityName[entityName].push(+idString);
            }
          }
          if (!hasValue) {
            unfilledEntities.push(entityName);
          }
          hasValue = false;
        });

        if (unfilledEntities.length) {
          setUnfilledEntityNames(unfilledEntities);
          toast.error("Please fill out all the forms.");
        }
        else {
          await fetchAPI({
            url: `/important-events/save`,
            method: "POST",
            body: importantEventsData
          });
          setUnfilledEntityNames([]);
          alert("Saved successfully.");
          return true;
        }
      }
      catch (e) {
        console.log("saving error: ", e);
      }
    }
    return false;
  };

  const handleSaveAndClose = async () => {
    const saved = await handleSave();
  };

  return (
    <Container maxWidth="lg">
      <Grid container sx={{ justifyContent: "space-between" }}>
        <img src={leafImage}></img>
        {todayStr}
      </Grid>
      <Typography variant="h3" align="center">{t("ImportantTitle")}</Typography>
      <br />
      <Typography variant="h5" align="center">{t("AnsweredTitle")}</Typography>
      <br />
      {/* Show Checkbox Sections */}
      <Container maxWidth="sm">
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h5" align="center">{t("Code Number")}:{codeNumber}</Typography>
          <Typography variant="h5" align="center">{t("Date")}:{todayStr}</Typography>
        </Stack>
      </Container>
      <br />

      {/* Show Checkbox Sections */}
      <Container maxWidth="md">
        {!!formData && !!importantEventsFormMetadata && (
          <Stack gap={3}>
            {importantEventsFormMetadata.map((metaData, metaDataIndex) => {
              return (
                <FormControl component="fieldset" fullWidth key={metaDataIndex}>
                  <FormLabel component="legend">
                    <Typography variant="h6" color="#33A474">{metaData.label}</Typography>
                  </FormLabel>
                  {unfilledEntityNames.includes(metaData.entityName) && (
                    <Typography color="error" fontSize={12}>* {t("Word.Required")}.</Typography>
                  )}
                  {(
                    <FormGroup >
                      {metaData.entitiesData.map((basicDataUnit, index) => (
                        basicDataUnit.description && (
                          <FormControlLabel
                            key={index}
                            control={
                              <Checkbox
                                checked={!!formData[metaData.entityName][basicDataUnit.id.toString()]}
                                onChange={() => handleChangeCheckbox(metaData.entityName, basicDataUnit.id.toString(), metaData)}
                              />}
                            label={t(basicDataUnit.description, { ns: "ImportantEvents" })}
                          />
                        ))
                      )}
                    </FormGroup>
                  )}
                </FormControl>
              );
            })}
          </Stack>
        )}
      </Container>
      <Stack direction="row" justifyContent="center" m={4} gap={4}>
        <ButtonPrimary
          variant="contained"
          onClick={handleSaveAndClose}
          endIcon={<SouthIcon />}
        >
          {t("Action.SaveAndClose")}
        </ButtonPrimary>
      </Stack>
      <Grid container sx={{ justifyContent: "space-between" }}>
        <img src={footerLogo}></img>
        <img src={eagle} height="100px"></img>
      </Grid>
    </Container>
  );
}