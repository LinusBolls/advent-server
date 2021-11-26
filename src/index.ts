import express, { Request, Response } from "express";
import moment from "moment";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = 5000;

const isTestMode = true;
const NOW = isTestMode ? moment("12-20 13:00", "MM-DD hh:mm") : moment();
const DOOR_FILE_PATH = "./doors.json";
const UNLOCK_TIME_AM = "06:00";

interface IDoor {
  link: string;
  img: string;
  title: string;
  desc: string;
}
function attachTimeData(rawDoorObj: any, doorIdx: number) {
  const doorMoment = moment(`12-${doorIdx} ${UNLOCK_TIME_AM}`, "MM-DD hh:mm");
  const isOpen = doorMoment.isBefore(NOW);
  const isToday = doorMoment.isSame(NOW, "day");
  const secsTillOpen = doorMoment.diff(NOW, "s");
  const isNextToOpen = !isOpen && (isToday || secsTillOpen < 24 * 60 * 60);

  return {
    door: doorIdx,
    isToday,
    isOpen,
    secsTillOpen,
    isNextToOpen,
    ...(isOpen ? rawDoorObj : { link: "", img: "", title: "", desc: "" }),
  };
}
app.use(cors({ origin: "http://localhost:3000" }));

app.get("/api/v1/doors", async (req: Request, res: Response) => {
  const doorFile = await fs.promises.readFile(DOOR_FILE_PATH);
  const doors: { [key: number]: IDoor } = JSON.parse(doorFile.toString());

  for (const [doorIdx, doorObj] of Object.entries(doors))
    doors[doorIdx as any] = attachTimeData(doorObj, parseInt(doorIdx));

  res.send({
    ok: 1,
    data: doors,
  });
});
app.get("/api/v1/door/:doorIdx", async (req: Request, res: Response) => {
  const doorFile = await fs.promises.readFile(DOOR_FILE_PATH);
  const doors: { [key: number]: IDoor } = JSON.parse(doorFile.toString());

  const doorIdx = parseInt(req.params.doorIdx);
  const rawDoorObj = doors[doorIdx];

  if (rawDoorObj == null)
    return res.status(404).send({ ok: 0, reason: "bruh tf are you on about" });

  const doorObj = attachTimeData(rawDoorObj, doorIdx);

  if (!doorObj.isOpen)
    return res
      .status(403)
      .send({ ok: 0, reason: "have a little more patience will ya ;)" });

  res.send({ ok: 1, data: doorObj });
});

app.listen(PORT, () =>
  console.log(`Advent calendar is listening on port ${PORT}`)
);
