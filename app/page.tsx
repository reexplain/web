import TopBar from "@/components/common/TopBar";
import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <>
      <TopBar />
      <div className="flex flex-col flex-1 gap-6 justify-center pb-24">
        {/* Motto */}
        <div className="font-secondary flex flex-col gap-4 text-5xl xs:text-6xl sm:text-7xl lg:text-8xl font-extralight">
          Knowledge,
          <span className="block font-medium">re-explained.</span>
        </div>
        <Button className="h-fit py-4 px-8 rounded-full font-secondary w-fit text-xl">Start learning!</Button>
      </div>
    </>
  )
}

export default Home;