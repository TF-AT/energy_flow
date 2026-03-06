import { Request, Response } from "express";
import { EventEmitter } from "events";

export const eventEmitter = new EventEmitter();

export const streamEvents = (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  console.log("[SSE] Client connected");

  const onNewReading = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: "READING", payload: data })}\n\n`);
  };

  const onNewAlert = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: "ALERT", payload: data })}\n\n`);
  };

  eventEmitter.on("reading", onNewReading);
  eventEmitter.on("alert", onNewAlert);

  req.on("close", () => {
    console.log("[SSE] Client disconnected");
    eventEmitter.off("reading", onNewReading);
    eventEmitter.off("alert", onNewAlert);
  });
};
