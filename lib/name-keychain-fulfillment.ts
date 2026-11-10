import { listKeychainFiles, saveKeychainFile } from "./store";
import { generateKeychain } from "./name-keychain-server";
import type { Order } from "./types";
export async function fulfillOrderKeychains(order: Order) {
  if (!order.items.some(item=>item.keychainConfiguration)) return;
  const existing=await listKeychainFiles(order.id);
  for(const [index,item] of order.items.entries()){
    if(!item.keychainConfiguration || existing.some(file=>file.itemIndex===index))continue;
    const bytes=await generateKeychain(item.keychainConfiguration);
    await saveKeychainFile({uniqueKey:`order:${order.id}:${index}`,orderId:order.id,orderNumber:order.number,itemIndex:index,source:"order",configuration:item.keychainConfiguration},bytes);
  }
}
