import { Delete,ExpandMore  } from '@mui/icons-material';
import { Card, CardContent, Container, IconButton, Typography, Checkbox, Accordion, AccordionSummary, AccordionDetails, Stack, TextField } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {HintTypes, Hints} from '../../models/ItemHints';
import _ from 'lodash';
import { FC, useState, useEffect } from 'react';

import { Tower } from '../../models/Tower';


const cell = (label: string, onCountedChanged: (() => void) | undefined = undefined, tower?: Tower, towers: Tower[] = [], getComparisonColumnValue: ((col: string) => number) | undefined = undefined) => {
  function OnCountedChanged(countIt: boolean) {
    if (tower)
      tower.isCounted = countIt;
    if (onCountedChanged !== undefined)
      onCountedChanged();
  }
  enum CellEnumFormat { Raw, String, LocaleString, Dollars, ShortDecimal }

  let cellFormat = CellEnumFormat.LocaleString;
  let cellAlign: "right" | "left" = "right";
  let cellValue: any;
  let cellForegroundColor: string | undefined = undefined;
  let cellCompareToValue: any = null;//will default to cellValue unless overwritten
  switch (label) {
    case "type":
      cellAlign = "left";
      cellFormat = CellEnumFormat.String;
      if (tower){
        cellFormat = CellEnumFormat.Raw;
        cellValue =  <TableCell padding='none' align={cellAlign}><Typography><Checkbox size='small' checked={tower.isCounted} onChange={(e) => OnCountedChanged(e.target.checked)} title="Enabled (consider in totals/effects on other towers)" />{tower.type}</Typography></TableCell>;
      }
      else if (getComparisonColumnValue !== undefined)
        cellValue = "Target";
      else
        cellValue = "Total";
      break;
    case "upgrades":
      cellAlign = "left";
      cellFormat = tower ? CellEnumFormat.String : CellEnumFormat.LocaleString;
      cellValue = tower ? tower.showUpgrades() : _.sum(_.map(towers, (tower) => tower.getTiers()));
      break;
    case "buffs":
      cellAlign = "left";
      cellFormat = CellEnumFormat.String;
      cellValue = tower ? tower.showBuffs() : "";
      break;
    case "cost":
      cellFormat = CellEnumFormat.Dollars;
      cellValue = tower ? tower.cost : _.sum(_.map(towers, (tower) => tower.cost));
      break;
    case "sellValue":
      cellFormat = CellEnumFormat.Dollars;
      cellValue = tower ? tower.sellValue : _.sum(_.map(towers, (tower) => tower.sellValue));
      break;
    case "favoredSellValue":
      cellFormat = CellEnumFormat.Dollars;
      cellValue = tower ? tower.favoredSellValue : _.sum(_.map(towers, (tower) => tower.favoredSellValue));
      break;
    case "income":
      cellFormat = CellEnumFormat.Dollars;
      cellValue = tower ? tower.income : _.sum(_.map(towers, (tower) => tower.income));
      break;
    case "efficiency":
    case "sellEfficiency":
    case "favoredSellEfficiency":
      let getDeductionAmount!: (tower: Tower) => number;
      let getEfficiency!: (tower: Tower) => number;
      if (label === "efficiency") {
        getDeductionAmount = (tower) => 0;
        getEfficiency = (tower) => tower.efficiency;
  } else if (label === "sellEfficiency") {
        getDeductionAmount = (tower) => tower.sellValue;
        getEfficiency = (tower) => tower.sellEfficiency;
  } else if (label === "favoredSellEfficiency") {
        getDeductionAmount = (tower) => tower.favoredSellValue;
        getEfficiency = (tower) => tower.favoredSellEfficiency;
      }

      cellFormat = CellEnumFormat.String;
      cellValue = "-";
      if (tower && isFinite(getEfficiency(tower))) {
        cellValue = getEfficiency(tower);
        cellFormat = CellEnumFormat.ShortDecimal;
      }
      else if (!tower) {
        let totalIncome = _.sum(_.map(towers, (tower) => tower.income));
        if (totalIncome) {
          cellValue = (_.sum( _.map(towers, (tower) => tower.cost)) - _.sum(_.map(towers, (tower) => getDeductionAmount(tower)) ) ) / totalIncome;
          cellFormat = CellEnumFormat.ShortDecimal;
  }
}
      break;

    case "abilityIncome":
      cellFormat = CellEnumFormat.Dollars;
      cellValue = tower ? tower.abilityIncome : _.sum(_.map(towers, (tower) => tower.abilityIncome));
      break;

    case "abilityCooldown":
      cellValue = tower ? tower.abilityCooldown : "-";
      if (!tower)
        cellFormat = CellEnumFormat.String;
      break;

    case "abilityEfficiency":
    case "abilitySellEfficiency":
    case "abilityFavoredSellEfficiency":
      cellFormat = CellEnumFormat.String;
      cellValue = "-";
      let getAbilityEfficiency!: (tower: Tower) => number;
      if (label === "abilityEfficiency")
        getAbilityEfficiency = (tower) => tower.abilityEfficiency;
      else if (label === "abilitySellEfficiency")
        getAbilityEfficiency = (tower) => tower.abilitySellEfficiency;
      else if (label === "abilityFavoredSellEfficiency")
        getAbilityEfficiency = (tower) => tower.abilityFavoredSellEfficiency;
      if (tower && isFinite(getAbilityEfficiency(tower))) {
        let cooldownMinutes = tower.abilityCooldown * getAbilityEfficiency(tower) / 60;
        cellValue = isFinite(getAbilityEfficiency(tower)) ? `${getAbilityEfficiency(tower).toFixed(1)} (${cooldownMinutes.toFixed(1)} min)` : "-";
        cellCompareToValue = cooldownMinutes;
      }

      break;
    default:
      break;

  }
  if (cellFormat === CellEnumFormat.Raw)
    return cellValue;
  if (getComparisonColumnValue !== undefined && label != "type") {
    let compareVal = getComparisonColumnValue(label);
    if (compareVal) {
      cellValue = compareVal - (cellCompareToValue === null ? cellValue : cellCompareToValue);
      cellForegroundColor = cellValue < 0 ? "red" : "green";
    }
    else {
      cellValue = "";
      cellFormat = CellEnumFormat.String;
    }
  }
  let formattedValue = cellValue;
  switch (cellFormat) {
    case CellEnumFormat.Dollars:
      let isNegative = cellValue < 0;
      if (isNegative)
        cellValue *= -1;
      formattedValue = "$" + cellValue.toLocaleString();
      if (isNegative)
        formattedValue = `(${formattedValue})`;
      break;
    case CellEnumFormat.LocaleString:
      formattedValue = cellValue.toLocaleString();
      break;
    case CellEnumFormat.ShortDecimal:
      formattedValue = cellValue.toFixed(2);
      break;
    case CellEnumFormat.String:
      break;
    default:
      throw "Format not handled";
  }
  return <TableCell align={cellAlign}><Typography color={cellForegroundColor} fontWeight={cellForegroundColor ? "bold" : undefined}>{formattedValue}</Typography></TableCell>;

}

interface TowerInfoTableProps {
  towers: Tower[],
  columns?: string[],
  onCountedChanged?: (() => void),
  removeTower?: (index: number) => void,
}

const TowerInfoTable: FC<TowerInfoTableProps> = ({
  towers,
  columns = ["type", "upgrades", "buffs", "cost", "sellValue", "favoredSellValue"],
  onCountedChanged = undefined,
  removeTower
}) =>
{ 
  
  const [countedTowers, setCountedTowers] = useState(towers);
  useEffect(() => {
    CountedTowersChanged();
  }, [towers]);
  
  function CountedTowersChanged(){
    setCountedTowers(towers.filter( (t) => t?.isCounted === true));
    if (onCountedChanged)
      onCountedChanged();
  }
  const [columnTargets, setColumnTargets] = useState({} as { [key: string]: number });
  function getColumnTarget(col : string) {
      let ret = columnTargets[col];
      return ! ret ? 0 : ret;
  }
  function setColumnTargetValue(col : string, val : string) {
    let num = val ? parseInt(val) : 0;
    let newVal = {...columnTargets};
    newVal[col] = num;
    setColumnTargets( newVal );
}
  console.log("Table called again");
  return (
<Stack spacing={2}>
  <Accordion>
  <AccordionSummary expandIcon={<ExpandMore/>} >
          <Typography fontWeight="bold" title={Hints.getHint(HintTypes.TargetTotals)}>Target Totals</Typography>
        </AccordionSummary>
        <AccordionDetails>
        <Stack direction="row" spacing={1}>
        {columns.map(col =>
        ["type","buffs"].includes(col) ? null :
        <TextField
                  label={`${_.startCase(col).replace("Ability ", "").replace("Favored Sell","Favored")}`}
                  type="number"
                  title={Hints.getPossibleHint(col)}
                  defaultValue={getColumnTarget(col) == 0 ? "" : getColumnTarget(col)}
                  onChange={(e) => setColumnTargetValue(col,e.target.value)}
                  sx={{ width: "200px" }}
                />
        )
        }
        </Stack>
        </AccordionDetails>
  </Accordion>

  <Card>
    <CardContent>
      <Container maxWidth="xl">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                {columns.map(x =>  
                <TableCell align={["type", "buffs", "upgrades"].includes(x) ? "left" : "right"}>
                    <Typography sx={{ fontWeight: 'bold' }} noWrap title={Hints.getPossibleHint(x)}>
                     {_.startCase(x).replace("Ability ", "").replace("Favored Sell","Favored")}
                  </Typography>
                </TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {towers.map((tower, towerIndex) => (
                <TableRow
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {
                    columns.map(column => cell(column, CountedTowersChanged, tower))
                  }
                  <TableCell>
                    <IconButton color="primary" aria-label="delete entry" onClick={() => {if (removeTower) removeTower(towerIndex) }}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {columns.map(column => cell(column, undefined, undefined, countedTowers))}
                <TableCell />
              </TableRow>


              { columns.some( column => getColumnTarget(column) != 0) ? 
              <TableRow
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              > 
                {columns.map(column => cell(column, undefined, undefined, countedTowers, getColumnTarget))}
                <TableCell />
              </TableRow> : <TableRow />}

            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </CardContent>
  </Card>
  </Stack>
);
}
export default TowerInfoTable;
